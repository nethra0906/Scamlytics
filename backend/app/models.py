from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from datetime import datetime
from .database import Base

class ScamReport(Base):
    __tablename__ = "scam_reports"
    id = Column(Integer, primary_key=True, index=True)
    input_text = Column(String)
    channel = Column(String)          # call/whatsapp/sms/email
    scam_probability = Column(Float)
    risk_level = Column(String)
    explanation = Column(String)
    recommended_action = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class CurrencyCheck(Base):
    __tablename__ = "currency_checks"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    verdict = Column(String)          # genuine/counterfeit
    confidence = Column(Float)
    suspicious_regions = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String)
    device_id = Column(String)
    account_id = Column(String)
    amount = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class FraudIncident(Base):
    __tablename__ = "fraud_incidents"
    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    incident_type = Column(String)
    district = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)