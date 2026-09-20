from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class PatternType(str, Enum):
    SHARED_DEVICE_RING = "SHARED_DEVICE_RING"
    SHARED_IP_CLUSTER = "SHARED_IP_CLUSTER"
    TRANSACTION_LAYERING = "TRANSACTION_LAYERING"
    MERCHANT_CONCENTRATION = "MERCHANT_CONCENTRATION"
    TRANSACTION_VELOCITY = "TRANSACTION_VELOCITY"
    MULTI_ACCOUNT_RING = "MULTI_ACCOUNT_RING"


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class EvidenceItem(BaseModel):
    rule: str
    detail: str
    metrics: Optional[Dict[str, Any]] = None


class FraudFinding(BaseModel):
    pattern: PatternType
    severity: Severity
    # Confidence represents the strength of available evidence supporting this pattern,
    # NOT a raw probability of fraud.
    confidence: float = Field(ge=0.0, le=1.0, description="Evidentiary support confidence (0.0 to 1.0)")
    entities: List[str] = Field(default_factory=list, description="IDs of entities involved in this finding")
    evidence: List[EvidenceItem] = Field(default_factory=list, description="Concrete corroborating evidence items")
    explanation: str = Field(description="Human and agent-readable forensic explanation")


class AccountAnalysisResult(BaseModel):
    account_id: str
    analyzed_at: datetime
    total_findings: int
    highest_severity: Severity
    findings: List[FraudFinding]
    summary: str


class CaseFindingsResult(BaseModel):
    case_id: str
    analyzed_at: datetime
    customer_id: Optional[str] = None
    target_accounts: List[str]
    total_findings: int
    highest_severity: Severity
    findings: List[FraudFinding]
    summary: str


class AnalyzeRequest(BaseModel):
    account_id: Optional[str] = None
    case_id: Optional[str] = None
    merchant_id: Optional[str] = None
    patterns_to_check: Optional[List[PatternType]] = None
