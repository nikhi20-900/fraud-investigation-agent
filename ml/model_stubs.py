"""
ML Component: Fraud Detection & Anomaly Scoring (Phase 1 Placeholder)

In later phases, this module will implement:
- Feature extraction pipelines
- XGBoost / LightGBM tabular fraud score prediction
- Graph Neural Network (GNN) node risk embedding
"""

from typing import Dict, Any


class FraudModelPipelineStub:
    def __init__(self, model_version: str = "v0.1-stub"):
        self.model_version = model_version

    def predict_risk_score(self, features: Dict[str, Any]) -> float:
        """
        Placeholder risk scoring inference.
        Returns a mock probability score between 0.0 and 1.0.
        """
        amount = features.get("amount", 0.0)
        is_new_device = features.get("is_new_device", False)
        velocity_count = features.get("velocity_count", 1)

        base_score = 0.1
        if amount > 5000:
            base_score += 0.35
        if is_new_device:
            base_score += 0.25
        if velocity_count > 5:
            base_score += 0.25

        return min(0.99, base_score)


if __name__ == "__main__":
    stub = FraudModelPipelineStub()
    score = stub.predict_risk_score({"amount": 7500, "is_new_device": True, "velocity_count": 8})
    print(f"Sample inferred score: {score:.2f}")
