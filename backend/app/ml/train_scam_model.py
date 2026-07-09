import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib
import os

SCAM_SAMPLES = [
    "This is CBI officer speaking, you are under digital arrest, do not disconnect the call",
    "Your Aadhaar card is linked to illegal parcel containing drugs, cooperate with investigation",
    "We are from customs department, your account will be frozen unless you pay immediately",
    "Stay on video call until verification complete, do not tell anyone about this call",
    "Your bank account is involved in money laundering case, share OTP to verify identity",
    "This is ED enforcement directorate, arrest warrant issued in your name, pay fine to avoid arrest",
    "Do not disconnect, this is police verification, transfer money to safe government account",
    "Your mobile number used in cybercrime, click this link to avoid FIR registration",
    "Congratulations you won lottery of 25 lakh rupees, pay processing fee to claim prize",
    "Your electricity connection will be disconnected tonight, pay immediately on this UPI",
    "TRAI is your number will be blocked in 2 hours due to illegal activity",
    "This call is being recorded for legal action, install this app for verification",
    "Share your bank OTP and PIN to unfreeze your account immediately",
    "You are speaking to income tax department, unpaid tax notice, settle now to avoid arrest",
    "Video call required, keep camera on, do not disconnect until case resolved",
]

LEGIT_SAMPLES = [
    "Hi, are we still meeting for lunch tomorrow at 1pm?",
    "Your order has been shipped and will arrive in 3 to 5 business days",
    "Reminder: your dentist appointment is scheduled for Friday at 10am",
    "Thanks for the update, I'll review the document and get back to you",
    "The meeting has been rescheduled to next Monday, please confirm availability",
    "Your monthly electricity bill of Rs 850 is due on the 15th, pay via app anytime",
    "Happy birthday! Hope you have a wonderful day",
    "Please find attached the invoice for last month's services",
    "Your OTP for login is 4521, valid for 10 minutes, do not share with anyone",
    "Can you send me the report by end of day?",
    "Your flight PNR XYZ123 is confirmed for 5th July",
    "Let's catch up over coffee this weekend",
    "The package you ordered has been delivered to your address",
    "Your subscription renews next month, manage it anytime in settings",
    "Team, great work on the product launch today!",
]

def train():
    texts = SCAM_SAMPLES + LEGIT_SAMPLES
    labels = [1]*len(SCAM_SAMPLES) + [0]*len(LEGIT_SAMPLES)

    vectorizer = TfidfVectorizer(ngram_range=(1,2), min_df=1)
    X = vectorizer.fit_transform(texts)

    clf = LogisticRegression(max_iter=1000, class_weight="balanced")
    clf.fit(X, labels)

    os.makedirs("app/ml/artifacts", exist_ok=True)
    joblib.dump(vectorizer, "app/ml/artifacts/vectorizer.pkl")
    joblib.dump(clf, "app/ml/artifacts/scam_clf.pkl")
    print("Model trained and saved.")

if __name__ == "__main__":
    train()