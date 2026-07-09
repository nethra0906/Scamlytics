import joblib
import os
import re

ARTIFACT_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
vectorizer = joblib.load(os.path.join(ARTIFACT_DIR, "vectorizer.pkl"))
clf = joblib.load(os.path.join(ARTIFACT_DIR, "scam_clf.pkl"))

RED_FLAG_PHRASES = [
    "digital arrest", "do not disconnect", "video call", "otp", "aadhaar",
    "cbi", "ed enforcement", "customs", "income tax", "arrest warrant",
    "frozen", "money laundering", "parcel", "trai", "processing fee",
    "lottery", "fir", "share your bank", "urgent", "pay immediately",
    "keep camera on", "install this app", "click this link"
]

def get_matched_flags(text: str):
    text_l = text.lower()
    return [p for p in RED_FLAG_PHRASES if p in text_l]

def classify_scam(text: str, channel: str = "unknown"):
    X = vectorizer.transform([text])
    proba = clf.predict_proba(X)[0][1]  # probability of scam class
    flags = get_matched_flags(text)

    # Boost score slightly per matched red flag (bounded)
    boost = min(len(flags) * 0.05, 0.25)
    final_score = min(proba + boost, 0.99)

    if final_score >= 0.75:
        risk = "HIGH"
        action = "Do not share OTP/money. Disconnect immediately and report to cybercrime.gov.in or call 1930."
    elif final_score >= 0.45:
        risk = "MEDIUM"
        action = "Be cautious. Verify sender/caller independently through official channels before acting."
    else:
        risk = "LOW"
        action = "No immediate red flags detected. Stay alert for unusual requests."

    if flags:
        explanation = f"Detected {len(flags)} scam indicator(s): {', '.join(flags[:5])}."
    else:
        explanation = "No strong keyword indicators found; score based on language pattern model."

    return {
        "scam_probability": round(float(final_score), 3),
        "risk_level": risk,
        "explanation": explanation,
        "recommended_action": action,
        "matched_flags": flags,
        "channel": channel
    }