from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import scam, currency, graph, geo, chat

app = FastAPI(title="Digital Public Safety AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(scam.router)
app.include_router(currency.router)
app.include_router(graph.router)
app.include_router(geo.router)
app.include_router(chat.router)

@app.get("/")
def root():
    return {"status": "ok", "service": "digital-public-safety-ai"}