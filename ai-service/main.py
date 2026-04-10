"""
============================================================
main.py - Hospital AI Microservice (FastAPI)
ML Models: Random Forest, Linear Regression, Time Series
============================================================
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import logging

from models.bed_predictor      import BedDemandPredictor
from models.equipment_predictor import EquipmentPredictor
from models.staff_predictor    import StaffPredictor

# ── Logging ─────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ── App Init ─────────────────────────────────────────────────
app = FastAPI(
    title="Hospital AI Resource Optimization",
    description="AI/ML microservice for bed demand, equipment, and staff prediction",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model Instances (loaded once at startup) ──────────────────
bed_predictor       = BedDemandPredictor()
equipment_predictor = EquipmentPredictor()
staff_predictor     = StaffPredictor()

# ── Pydantic Schemas ─────────────────────────────────────────
class HistoricalEntry(BaseModel):
    date: str
    admissions: int

class BedPredictionRequest(BaseModel):
    historical_data: List[HistoricalEntry]
    days_ahead: int = 7

class EquipmentEntry(BaseModel):
    name: str
    department: str
    current_usage: float
    total: int
    utilization_rate: float

class EquipmentPredictionRequest(BaseModel):
    equipment_data: List[EquipmentEntry]
    days_ahead: int = 1

class StaffEntry(BaseModel):
    _id: Dict[str, str]
    count: int

class StaffPredictionRequest(BaseModel):
    patient_data: List[HistoricalEntry]
    staff_data: List[Any]

# ── Health Check ─────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "service": "Hospital AI Microservice",
        "status": "running",
        "version": "1.0.0",
        "endpoints": ["/predict/beds", "/predict/equipment", "/predict/staff", "/health"]
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# ── Bed Demand Prediction ────────────────────────────────────
@app.post("/predict/beds")
async def predict_bed_demand(request: BedPredictionRequest):
    try:
        logger.info(f"Bed prediction requested for {request.days_ahead} days ahead")

        data = pd.DataFrame([{"date": e.date, "admissions": e.admissions}
                              for e in request.historical_data])

        result = bed_predictor.predict(data, request.days_ahead)
        return result

    except Exception as e:
        logger.error(f"Bed prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── Equipment Usage Prediction ───────────────────────────────
@app.post("/predict/equipment")
async def predict_equipment_usage(request: EquipmentPredictionRequest):
    try:
        logger.info(f"Equipment prediction requested for {request.days_ahead} days ahead")

        data = pd.DataFrame([e.dict() for e in request.equipment_data])
        result = equipment_predictor.predict(data, request.days_ahead)
        return result

    except Exception as e:
        logger.error(f"Equipment prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── Staff Requirement Prediction ─────────────────────────────
@app.post("/predict/staff")
async def predict_staff_requirements(request: StaffPredictionRequest):
    try:
        logger.info("Staff prediction requested")

        patient_df = pd.DataFrame([{"date": e.date, "admissions": e.admissions}
                                   for e in request.patient_data])
        result = staff_predictor.predict(patient_df, request.days_ahead if hasattr(request, 'days_ahead') else 7)
        return result

    except Exception as e:
        logger.error(f"Staff prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── Generate Sample Data for Training ────────────────────────
@app.get("/generate-sample-data")
async def generate_sample():
    from utils.data_generator import generate_all_datasets
    paths = generate_all_datasets()
    return {"success": True, "message": "Sample datasets generated", "files": paths}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
