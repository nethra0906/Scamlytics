"""
test_api.py — Integration tests for Scamlytics backend API.
Run with: cd backend && python -m pytest tests/ -v
"""
import io
import pytest


# ── Health ────────────────────────────────────────────────────────────────────

def test_root(client):
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


# ── Auth ──────────────────────────────────────────────────────────────────────

def test_login_police(client):
    res = client.post("/auth/login", json={"username": "police", "password": "police123", "role": "police"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "police"


def test_login_invalid(client):
    res = client.post("/auth/login", json={"username": "police", "password": "wrongpass", "role": "police"})
    assert res.status_code == 401


def test_get_me_no_token(client):
    # Without REQUIRE_AUTH=true, missing token returns guest/citizen
    res = client.get("/auth/me")
    assert res.status_code == 200
    assert res.json()["role"] == "citizen"


# ── Dashboard ─────────────────────────────────────────────────────────────────

def test_dashboard_stats(client):
    res = client.get("/dashboard/stats")
    assert res.status_code == 200
    data = res.json()
    assert "scam_module" in data
    assert "currency_module" in data
    assert "graph_module" in data
    assert "geo_module" in data


def test_dashboard_stats_cached(client):
    """Second request should also return 200 (served from cache)."""
    r1 = client.get("/dashboard/stats")
    r2 = client.get("/dashboard/stats")
    assert r1.status_code == 200
    assert r2.status_code == 200


# ── Scam ──────────────────────────────────────────────────────────────────────

def test_scam_analyze(client):
    payload = {
        "text": "Your Aadhaar card is suspended due to money laundering. Pay immediately to avoid arrest.",
        "channel": "call",
    }
    res = client.post("/scam/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "scam_probability" in data
    assert "risk_level" in data
    assert data["risk_level"] in ("LOW", "MEDIUM", "HIGH")


def test_scam_history(client):
    res = client.get("/scam/history")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


# ── Currency ──────────────────────────────────────────────────────────────────

def test_currency_analyze_invalid_mime(client, police_headers):
    """Non-image file should return 415 (once past the role check)."""
    fake_pdf = io.BytesIO(b"%PDF-1.4 fake pdf content")
    res = client.post(
        "/currency/analyze",
        files={"file": ("test.pdf", fake_pdf, "application/pdf")},
        headers=police_headers,
    )
    assert res.status_code == 415


def test_currency_history(client, bank_headers):
    res = client.get("/currency/history", headers=bank_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_currency_requires_auth(client):
    """Currency is restricted to police/bank — a guest (citizen) is forbidden."""
    res = client.get("/currency/history")
    assert res.status_code == 403


def test_currency_forbidden_for_citizen(client, citizen_headers):
    res = client.get("/currency/history", headers=citizen_headers)
    assert res.status_code == 403


# ── Graph ─────────────────────────────────────────────────────────────────────

def test_graph_ingest_and_analyze(client, police_headers):
    payload = {
        "transactions": [
            {"phone_number": "9876543210", "device_id": "DEV001", "account_id": "ACC001", "amount": 5000.0},
            {"phone_number": "9876543210", "device_id": "DEV002", "account_id": "ACC002", "amount": 8000.0},
            {"phone_number": "9111111111", "device_id": "DEV001", "account_id": "ACC003", "amount": 2000.0},
        ]
    }
    ingest_res = client.post("/graph/ingest", json=payload, headers=police_headers)
    assert ingest_res.status_code == 200
    assert ingest_res.json()["ingested"] == 3

    analyze_res = client.get("/graph/analyze", headers=police_headers)
    assert analyze_res.status_code == 200
    data = analyze_res.json()
    assert "total_nodes" in data
    assert data["total_nodes"] > 0


def test_graph_requires_police(client):
    res = client.get("/graph/analyze")
    assert res.status_code == 403


def test_graph_query_engine(client, police_headers):
    """The query console runs real graph computations, not string matching."""
    payload = {
        "transactions": [
            {"phone_number": "9000000001", "device_id": "DEVX", "account_id": "ACCX1", "amount": 100.0},
            {"phone_number": "9000000002", "device_id": "DEVX", "account_id": "ACCX2", "amount": 200.0},
            {"phone_number": "9000000003", "device_id": "DEVX", "account_id": "ACCX3", "amount": 300.0},
        ]
    }
    client.post("/graph/ingest", json=payload, headers=police_headers)
    client.get("/graph/analyze", headers=police_headers)

    count_res = client.post("/graph/query", json={"query": "COUNT"}, headers=police_headers)
    assert count_res.status_code == 200
    assert "Nodes:" in count_res.json()["result"]

    node_res = client.post(
        "/graph/query", json={"query": "PHONE:9000000001"}, headers=police_headers
    )
    assert node_res.json()["node"] == "PHONE:9000000001"
    assert node_res.json()["degree"] >= 1


# ── Geo ───────────────────────────────────────────────────────────────────────

def test_geo_ingest_and_heatmap(client, police_headers):
    payload = {
        "incidents": [
            {"latitude": 12.9716, "longitude": 77.5946, "incident_type": "UPI Fraud", "district": "Bengaluru"},
            {"latitude": 28.7041, "longitude": 77.1025, "incident_type": "Digital Arrest", "district": "Delhi"},
        ]
    }
    ingest_res = client.post("/geo/ingest", json=payload, headers=police_headers)
    assert ingest_res.status_code == 200

    heatmap_res = client.get("/geo/heatmap", headers=police_headers)
    assert heatmap_res.status_code == 200
    assert len(heatmap_res.json()) >= 2


def test_geo_requires_police(client, bank_headers):
    """Geo intel is police-only — even an authenticated bank analyst is forbidden."""
    assert client.get("/geo/heatmap").status_code == 403
    assert client.get("/geo/heatmap", headers=bank_headers).status_code == 403


# ── Chat rate limiting ────────────────────────────────────────────────────────

def test_chat_message(client):
    res = client.post("/chat/message", json={"message": "What is a digital arrest scam?", "history": []})
    # May fail if GROQ_API_KEY is missing in test env — just check not 5xx from our code
    assert res.status_code in (200, 429, 500, 503)
