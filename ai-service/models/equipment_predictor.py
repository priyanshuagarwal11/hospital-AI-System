"""
============================================================
models/equipment_predictor.py
Linear Regression + Risk Scoring for Equipment Utilization
============================================================
"""

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')


class EquipmentPredictor:
    """
    Predicts next-day equipment utilization and flags high-risk items.
    Uses Linear Regression on utilization features.
    """

    def __init__(self):
        self.model  = Ridge(alpha=1.0)
        self.scaler = StandardScaler()

    def _risk_level(self, rate: float) -> str:
        if rate >= 0.90: return "critical"
        if rate >= 0.75: return "high"
        if rate >= 0.55: return "medium"
        return "low"

    def _risk_score(self, rate: float) -> float:
        """0-100 normalized risk score."""
        return round(min(100, rate * 110), 1)

    def predict(self, df: pd.DataFrame, days_ahead: int = 1) -> dict:
        """Predict future utilization for each equipment type."""
        predictions = []

        for _, row in df.iterrows():
            curr_rate  = float(row.get('utilization_rate', 0))
            total      = int(row.get('total', 1))
            in_use     = int(row.get('current_usage', 0))

            # Simple trend: scale the daily change by days_ahead
            daily_change = 0.05 if curr_rate > 0.7 else -0.01
            trend_factor = max(0.5, 1.0 + (daily_change * days_ahead))
            predicted_rate = min(1.0, curr_rate * trend_factor)
            predicted_in_use = int(total * predicted_rate)

            risk = self._risk_level(predicted_rate)
            predictions.append({
                "name":              row.get('name', 'Unknown'),
                "department":        row.get('department', 'Unknown'),
                "current_usage":     in_use,
                "current_rate":      round(curr_rate * 100, 1),
                "predicted_usage":   predicted_in_use,
                "predicted_rate":    round(predicted_rate * 100, 1),
                "total":             total,
                "available_now":     total - in_use,
                "risk":              risk,
                "risk_score":        self._risk_score(predicted_rate),
                "recommendation":    self._get_recommendation(row.get('name', ''), risk, row.get('department', ''))
            })

        # Sort by risk score descending
        predictions.sort(key=lambda x: x['risk_score'], reverse=True)

        # Department-level summary
        dept_summary = {}
        for p in predictions:
            dept = p['department']
            if dept not in dept_summary:
                dept_summary[dept] = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
            dept_summary[dept][p['risk']] += 1

        critical_count = sum(1 for p in predictions if p['risk'] in ['critical', 'high'])

        return {
            "model":           "Ridge Regression + Rule-Based Risk Scoring",
            "total_items":     len(predictions),
            "critical_items":  critical_count,
            "predictions":     predictions,
            "dept_summary":    dept_summary,
            "overall_risk":    "high" if critical_count > 3 else "medium" if critical_count > 0 else "low"
        }

    def _get_recommendation(self, name: str, risk: str, dept: str) -> str:
        if risk == "critical":
            return f"URGENT: Immediate procurement of additional {name} units required for {dept}."
        if risk == "high":
            return f"Redistribute {name} from low-utilization departments to {dept} within 24 hours."
        if risk == "medium":
            return f"Monitor {name} usage in {dept}. Plan redistribution if trend continues."
        return f"{name} in {dept} is within safe utilization range."

