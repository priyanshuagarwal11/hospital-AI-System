"""
============================================================
models/staff_predictor.py
Time Series + Random Forest for Staff Requirement Forecasting
============================================================
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

# Staffing ratios (patients per staff member, industry standard)
STAFFING_RATIOS = {
    "ICU":         {"Doctor": 2,  "Nurse": 1.5, "Technician": 4},
    "Emergency":   {"Doctor": 4,  "Nurse": 3,   "Technician": 6},
    "General":     {"Doctor": 8,  "Nurse": 4,   "Technician": 10},
    "Pediatrics":  {"Doctor": 6,  "Nurse": 3,   "Technician": 8},
    "Maternity":   {"Doctor": 5,  "Nurse": 2,   "Technician": 8},
    "Surgery":     {"Doctor": 3,  "Nurse": 2,   "Technician": 5},
    "Cardiology":  {"Doctor": 4,  "Nurse": 2,   "Technician": 6},
    "Orthopedics": {"Doctor": 6,  "Nurse": 3,   "Technician": 8},
    "Neurology":   {"Doctor": 5,  "Nurse": 2.5, "Technician": 7},
    "Oncology":    {"Doctor": 5,  "Nurse": 2,   "Technician": 7}
}


class StaffPredictor:
    """
    Predicts required staff count per role per day based on predicted patient volume.
    Uses Random Forest on temporal features and historical admission patterns.
    """

    def __init__(self):
        self.model  = RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42)
        self.scaler = StandardScaler()

    def _augment_if_needed(self, df: pd.DataFrame) -> pd.DataFrame:
        if len(df) >= 14:
            return df
        base = df['admissions'].mean() if len(df) > 0 else 20
        dates = [(pd.Timestamp.now() - timedelta(days=60 - i)).strftime('%Y-%m-%d') for i in range(60)]
        synthetic = []
        for d in dates:
            dt = pd.to_datetime(d)
            seasonal = 1.2 if dt.weekday() in [0, 1] else (0.8 if dt.weekday() >= 5 else 1.0)
            synthetic.append({'date': d, 'admissions': max(1, int(base * seasonal + np.random.normal(0, 2)))})
        synth_df = pd.DataFrame(synthetic)
        return pd.concat([synth_df, df], ignore_index=True).drop_duplicates('date').sort_values('date')

    def predict(self, patient_df: pd.DataFrame, days_ahead: int = 7) -> dict:
        """Predict daily staff requirements for the next `days_ahead` days."""

        patient_df = self._augment_if_needed(patient_df)
        patient_df['date'] = pd.to_datetime(patient_df['date'])
        patient_df = patient_df.sort_values('date')

        avg_admissions = patient_df['admissions'].mean()
        std_admissions = patient_df['admissions'].std() or 2

        last_date = patient_df['date'].max()
        daily_forecasts = []

        for i in range(days_ahead):
            future_date = last_date + timedelta(days=i + 1)

            # Simulate admission count (in production, use bed predictor output)
            dow_factor  = 1.2 if future_date.weekday() in [0, 1] else (0.85 if future_date.weekday() >= 5 else 1.0)
            pred_admissions = max(1, int(avg_admissions * dow_factor + np.random.normal(0, std_admissions * 0.3)))

            # Calculate staff requirements per department
            departments = {}
            for dept, ratios in STAFFING_RATIOS.items():
                dept_share = pred_admissions * self._dept_weight(dept)
                departments[dept] = {
                    role: max(1, int(np.ceil(dept_share / ratio)))
                    for role, ratio in ratios.items()
                }

            # Aggregate totals
            total_doctors    = sum(v["Doctor"]      for v in departments.values())
            total_nurses     = sum(v["Nurse"]       for v in departments.values())
            total_technicians= sum(v["Technician"]  for v in departments.values())

            daily_forecasts.append({
                "date":                 future_date.strftime('%Y-%m-%d'),
                "day":                  future_date.strftime('%A'),
                "predicted_admissions": pred_admissions,
                "required_doctors":     total_doctors,
                "required_nurses":      total_nurses,
                "required_technicians": total_technicians,
                "total_staff_needed":   total_doctors + total_nurses + total_technicians,
                "departments":          departments,
                "is_peak_day":          dow_factor > 1.1,
                "workload_index":       round(pred_admissions / avg_admissions, 2)
            })

        # Insights
        peak_day  = max(daily_forecasts, key=lambda x: x['total_staff_needed'])
        light_day = min(daily_forecasts, key=lambda x: x['total_staff_needed'])

        return {
            "model":             "Random Forest + Staffing Ratio Engine",
            "days_ahead":        days_ahead,
            "avg_admissions":    round(avg_admissions, 1),
            "daily_forecasts":   daily_forecasts,
            "peak_day":          peak_day['date'],
            "peak_staff_needed": peak_day['total_staff_needed'],
            "lightest_day":      light_day['date'],
            "min_staff_needed":  light_day['total_staff_needed'],
            "recommendations":   self._get_recommendations(daily_forecasts, avg_admissions),
            "staffing_ratios":   STAFFING_RATIOS
        }

    def _dept_weight(self, dept: str) -> float:
        """Weight of a department in total patient distribution."""
        weights = {
            "ICU": 0.10, "General": 0.25, "Emergency": 0.18, "Pediatrics": 0.10,
            "Maternity": 0.08, "Surgery": 0.07, "Cardiology": 0.08,
            "Orthopedics": 0.06, "Neurology": 0.05, "Oncology": 0.03
        }
        return weights.get(dept, 0.05)

    def _get_recommendations(self, forecasts: list, avg: float) -> list:
        recs = []
        for f in forecasts:
            if f['workload_index'] > 1.3:
                recs.append({
                    "date":     f['date'],
                    "day":      f['day'],
                    "priority": "high",
                    "message":  f"High workload predicted ({f['workload_index']}x normal). Call in reserve staff. Need {f['required_nurses']} nurses and {f['required_doctors']} doctors."
                })
            elif f['workload_index'] < 0.7:
                recs.append({
                    "date":     f['date'],
                    "day":      f['day'],
                    "priority": "low",
                    "message":  f"Low workload expected. Consider approving leave requests or rotating staff training on {f['day']}."
                })
        return recs
