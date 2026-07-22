import asyncio
import random

from fastapi import APIRouter, UploadFile, File

router = APIRouter(prefix="/audio", tags=["audio"])

@router.post("/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    """
    MOCK ENDPOINT: Speech/Voice Deepfake Detection.

    ⚠️ This is a DEMO STUB — it returns a randomised result and does NOT
    perform real deepfake analysis. In production this would run a lightweight
    audio classifier (e.g. wav2vec2 or a Whisper variant fine-tuned for
    spoofing detection) via transformers/torchaudio, typically on GPU/cloud
    inference for low latency.
    """
    # Simulate processing delay without blocking the event loop.
    await asyncio.sleep(1.5)

    # Mock inference logic
    is_spoof = random.choice([True, False])
    confidence = random.uniform(0.75, 0.99)

    return {
        "filename": file.filename,
        "is_spoofed": is_spoof,
        "confidence": round(confidence, 4),
        "model_used": "mocked-wav2vec2-spoof-detector",
        "is_mock": True,
        "note": "DEMO ONLY — simulated result, not real deepfake detection. "
                "Production deployment requires a trained audio spoofing model.",
    }
