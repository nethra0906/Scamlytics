import numpy as np
from collections import defaultdict

def simple_grid_clustering(incidents: list, grid_size: float = 0.05):
    """
    Groups incidents into grid cells (approx ~5km at equator) to find hotspots.
    incidents: list of dicts with latitude, longitude, incident_type, district
    """
    grid = defaultdict(list)
    for inc in incidents:
        cell_x = round(inc["latitude"] / grid_size) * grid_size
        cell_y = round(inc["longitude"] / grid_size) * grid_size
        grid[(cell_x, cell_y)].append(inc)

    hotspots = []
    for (cx, cy), items in grid.items():
        if len(items) >= 2:  # threshold for a "hotspot"
            hotspots.append({
                "center_lat": cx,
                "center_lng": cy,
                "incident_count": len(items),
                "types": list(set(i["incident_type"] for i in items)),
                "severity": "HIGH" if len(items) >= 5 else "MEDIUM" if len(items) >= 3 else "LOW",
            })

    hotspots.sort(key=lambda h: h["incident_count"], reverse=True)
    return hotspots

def district_risk_scoring(incidents: list):
    district_counts = defaultdict(int)
    district_types = defaultdict(set)

    for inc in incidents:
        d = inc.get("district") or "Unknown"
        district_counts[d] += 1
        district_types[d].add(inc["incident_type"])

    if not district_counts:
        return []

    max_count = max(district_counts.values())
    results = []
    for d, count in district_counts.items():
        risk_score = round((count / max_count) * 100, 1)
        risk_level = "HIGH" if risk_score >= 70 else "MEDIUM" if risk_score >= 35 else "LOW"
        results.append({
            "district": d,
            "incident_count": count,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "incident_types": list(district_types[d]),
        })

    results.sort(key=lambda r: r["risk_score"], reverse=True)
    return results