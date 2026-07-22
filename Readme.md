# 🛡️ Digital Public Safety AI Platform

**AI-powered platform to detect and disrupt digital arrest scams, counterfeit currency, fraud networks, and crime hotspots — built for the "AI for Digital Public Safety" hackathon challenge.**

![Status](https://img.shields.io/badge/status-hackathon%20prototype-orange)
![Python](https://img.shields.io/badge/backend-FastAPI-009688)
![React](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61DAFB)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📖 Overview

India registered **1.14 million cybercrime complaints in 2023**, and "digital arrest" scams alone defrauded citizens of over **₹1,776 crore** in the first nine months of 2024. This platform tackles the problem with five integrated AI modules — shifting law enforcement and citizens from reactive investigation to **proactive threat detection**.

## ✨ Features

| Module | What it does |
|---|---|
| 🚨 **Digital Arrest Scam Detection** | Analyzes call transcripts, WhatsApp/SMS/email text → scam probability, risk level, explanation, recommended action |
| 💵 **Counterfeit Currency Detection** | Computer vision analysis of currency note images → genuine/counterfeit verdict, confidence score, highlighted suspicious regions |
| 🕸️ **Fraud Network Graph Intelligence** | Maps phone/device/account linkages from transaction data → fraud cluster detection, interactive graph visualization |
| 🗺️ **Geospatial Crime Intelligence** | Plots fraud incidents on a map → hotspot detection, district-wise risk scoring |
| 🤖 **Citizen Fraud Assistant** | Multilingual chatbot — explains scams, analyzes suspicious messages, guides reporting to cybercrime.gov.in / 1930 |

## 🔐 Access Control (Roles)

Access is gated by a **JWT login** and enforced **server-side** — the role is not a
client-side toggle. Sign in decides which modules you can reach:

| Role | Login | Can access |
|---|---|---|
| **Police** | `police / police123` | All modules |
| **Bank** | `bank / bank123` | Dashboard, Scam Checker, Currency Checker |
| **Citizen** | `citizen / citizen123` | Dashboard, Scam Checker, Citizen Assistant |

Currency (`/currency/*`) requires **police or bank**; Fraud Graph (`/graph/*`) and
Geo Intel (`/geo/*`) are **police-only** — other roles get an HTTP `403`.
Auth behaviour is configurable via env vars (`JWT_SECRET_KEY`, `JWT_EXPIRE_HOURS`,
`REQUIRE_AUTH`).

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                │
│  Dashboard | Scam Checker | Currency Scan | Graph | Map   │
└───────────────────────────┬────────────────────────────┘
                             │ REST (axios)
┌───────────────────────────▼────────────────────────────┐
│                    FastAPI Backend (Uvicorn)              │
│  /scam  /currency  /graph  /geo  /chat   routers          │
├─────────────┬───────────┬───────────┬───────────┬────────┤
│ Scam ML     │ CV Model  │ NetworkX  │ Geo utils │ LLM API │
│ (sklearn)   │ (OpenCV)  │ (fraud    │ (heatmap/ │ (Groq)  │
│             │           │  clusters)│ hotspot)  │         │
└─────────────┴───────────┴───────────┴───────────┴────────┘
                             │
                    ┌────────▼────────┐
                    │  SQLite (app.db)  │
                    │ scams, currency,  │
                    │ transactions,     │
                    │ incidents         │
                    └───────────────────┘
```

## 🧰 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | Fast dev, minimal config |
| Backend | FastAPI + Uvicorn | Async, auto Swagger docs, Python-native |
| Database | SQLite (SQLAlchemy ORM) | Zero setup, easy Postgres upgrade path |
| Scam Detection | TF-IDF + Scikit-learn Logistic Regression + keyword rules | Lightweight, explainable, fast |
| Currency Detection | OpenCV heuristics (edge/sharpness/color/texture analysis) | Explainable, no training data required |
| Graph Intelligence | NetworkX + Pyvis | Fraud ring clustering + interactive visualization |
| Geospatial | React-Leaflet + OpenStreetMap | Free, no API key required |
| Chatbot | Groq API (Llama 3.1 8B Instant) | Fast, free-tier, multilingual |

## 📁 Project Structure

```
digital-safety-ai/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── routers/
│   │   │   ├── scam.py
│   │   │   ├── currency.py
│   │   │   ├── graph.py
│   │   │   ├── geo.py
│   │   │   └── chat.py
│   │   ├── ml/
│   │   │   ├── scam_classifier.py
│   │   │   ├── train_scam_model.py
│   │   │   ├── currency_model.py
│   │   │   ├── graph_engine.py
│   │   │   ├── chat_service.py
│   │   │   └── artifacts/          # trained model files
│   │   ├── utils/
│   │   │   └── geo_utils.py
│   │   └── static/                 # generated graph HTML
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── api.js
    │   └── pages/
    │       ├── Dashboard.jsx
    │       ├── ScamChecker.jsx
    │       ├── CurrencyChecker.jsx
    │       ├── FraudGraph.jsx
    │       ├── GeoIntel.jsx
    │       └── CitizenAssistant.jsx
    ├── package.json
    └── tailwind.config.js
```

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A free [Groq API key](https://console.groq.com) (for the chatbot module)

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/digital-safety-ai.git
cd digital-safety-ai
```

### 2. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

Create a `.env` file in `backend/` (all values are optional — the app boots
without them; only the chatbot needs the Groq key):

```env
GROQ_API_KEY=your_free_groq_key_here     # optional — chatbot degrades gracefully if unset
DATABASE_URL=sqlite:///./app.db          # swap for postgresql://… in production
JWT_SECRET_KEY=change-me-in-production    # optional — a default is used otherwise
JWT_EXPIRE_HOURS=8                        # optional
# ALLOWED_ORIGINS=http://localhost:5173   # optional CORS allow-list
# REDIS_URL=redis://localhost:6379/0      # optional — falls back to in-memory cache
```

> **Note:** the counterfeit-currency **CNN is optional** and not installed by
> default (it stays disabled and falls back to OpenCV heuristics). To enable it,
> install `torch`/`torchvision` for your platform and drop trained weights into
> `backend/app/ml/weights/`.

Train the scam classifier (one-time):

```bash
python -m app.ml.train_scam_model
```

Run the backend:

```bash
uvicorn app.main:app --reload
```

API docs available at → `http://127.0.0.1:8000/docs`

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

App available at → `http://localhost:5173`

## 🔌 API Reference

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `POST` | `/auth/login` | public | Exchange username/password for a JWT |
| `GET` | `/auth/me` | any | Current token payload |
| `GET` | `/dashboard/stats` | any | Aggregated dashboard statistics (cached) |
| `POST` | `/scam/analyze` | any | Analyze text for scam indicators |
| `GET` | `/scam/history` | any | Recent scam analysis history |
| `POST` | `/scam/report/{id}` | any | Generate NCRB-style PDF for a scam record |
| `POST` | `/currency/analyze` | police, bank | Upload currency note image for verification |
| `GET` | `/currency/history` | police, bank | Recent currency check history |
| `POST` | `/graph/ingest` | police | Ingest transaction records |
| `GET` | `/graph/analyze` | police | Get fraud clusters |
| `GET` | `/graph/view` | public | Interactive fraud network graph (HTML, iframe-embeddable) |
| `POST` | `/graph/query` | police | Query the graph — `COUNT`, `SUSPICIOUS`, `HUBS`, or a node id |
| `POST` | `/geo/ingest` | police | Ingest fraud incident coordinates |
| `GET` | `/geo/heatmap` | police | Raw incident points |
| `GET` | `/geo/hotspots` | police | Detected crime hotspots |
| `GET` | `/geo/district-risk` | police | District-wise risk scoring |
| `POST` | `/audio/analyze` | any | ⚠️ Demo stub — simulated deepfake result |
| `POST` | `/chat/message` | any | Chat with the citizen fraud assistant (rate-limited) |

## 🧪 Testing

Use the Swagger UI at `/docs` to test each endpoint interactively, or use the frontend pages directly:

| Page | Route |
|---|---|
| Dashboard | `/` |
| Scam Checker | `/scam` |
| Currency Checker | `/currency` |
| Fraud Graph | `/graph` |
| Geo Intelligence | `/geo` |
| Citizen Assistant | `/assistant` |

## ⚠️ Known Limitations

- **Scam classifier** trained on a small synthetic dataset — production use would need a larger labeled corpus of real scam transcripts.
- **Currency detection** uses classical CV heuristics (no labeled FICN dataset available) rather than a trained CNN — a documented, explainable trade-off for hackathon scope. Swapping in a fine-tuned CNN is a planned improvement.
- **Audio deepfake** detection is a **demo stub** that returns a simulated result — it is clearly labeled as such in the UI and API and is not real spoofing detection.
- **SQLite** is used for simplicity — swap `DATABASE_URL` for PostgreSQL in production.
- **Auth** ships with in-source demo users and a default JWT secret — set `JWT_SECRET_KEY` and back it with a real user store for production.

## 🔮 Future Improvements

- Fine-tuned CNN for counterfeit currency detection on labeled FICN datasets
- Real-time call/voice deepfake detection (speech AI)
- Direct NCRB / cybercrime.gov.in reporting integration
- Neo4j/graph database for larger-scale fraud network analysis
- Mobile app + WhatsApp/IVR integration for the citizen assistant
- Court-admissible intelligence report export (PDF)

## 👥 Team

Built for the **AI for Digital Public Safety** hackathon challenge — *Defeating Counterfeiting, Fraud & Digital Arrest Scams*.

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.