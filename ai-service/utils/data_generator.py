"""
============================================================
utils/data_generator.py
Generate realistic hospital CSV datasets for ML training
============================================================
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os

DEPARTMENTS = ['ICU','General','Emergency','Pediatrics','Maternity','Surgery','Cardiology','Orthopedics','Neurology','Oncology']
EQUIPMENT   = ['Ventilator','ECG Monitor','Infusion Pump','Defibrillator','Ultrasound','Pulse Oximeter']
ROLES       = ['Doctor','Nurse','Technician','Pharmacist','Admin']
DIAGNOSES   = ['Hypertension','Diabetes','Pneumonia','Fracture','Stroke','Sepsis','COPD','Heart Failure']
SHIFTS      = ['morning','afternoon','night']

np.random.seed(42)
rand = np.random.RandomState(42)


def generate_patient_admissions(days: int = 365) -> pd.DataFrame:
    """Daily patient admission records with seasonal and weekly patterns."""
    records = []
    base_date = datetime.now() - timedelta(days=days)

    for d in range(days):
        date   = base_date + timedelta(days=d)
        dow    = date.weekday()
        month  = date.month

        # Seasonal: winter spike, summer low
        seasonal = 1.2 if month in [11, 12, 1, 2] else (0.85 if month in [6, 7, 8] else 1.0)
        # Weekly: Monday-Tuesday busier
        weekly = 1.25 if dow in [0, 1] else (0.80 if dow >= 5 else 1.0)

        base_count = 22
        admissions = int(base_count * seasonal * weekly + rand.normal(0, 3))
        admissions = max(5, admissions)

        # Department breakdown
        dept_weights = [0.10, 0.25, 0.18, 0.10, 0.08, 0.07, 0.08, 0.06, 0.05, 0.03]
        dept_counts  = rand.multinomial(admissions, dept_weights)

        for dept, count in zip(DEPARTMENTS, dept_counts):
            for _ in range(count):
                los = rand.randint(1, 15 if dept == 'ICU' else 8)
                records.append({
                    'date':           date.strftime('%Y-%m-%d'),
                    'day_of_week':    date.strftime('%A'),
                    'month':          month,
                    'department':     dept,
                    'admissions':     1,
                    'diagnosis':      rand.choice(DIAGNOSES),
                    'age':            rand.randint(1, 90),
                    'gender':         rand.choice(['M', 'F']),
                    'severity':       rand.choice(['critical','serious','moderate','mild','stable']),
                    'length_of_stay': los,
                    'insurance':      rand.choice(['Yes', 'No']),
                    'discharge_type': rand.choice(['recovered','transferred','against_advice','deceased'], p=[0.82,0.10,0.05,0.03])
                })

    df = pd.DataFrame(records)
    print(f"✅ Patient admissions: {len(df)} records over {days} days")
    return df


def generate_bed_usage(days: int = 365) -> pd.DataFrame:
    """Daily bed occupancy by department."""
    records = []
    base_date = datetime.now() - timedelta(days=days)

    dept_capacity = {
        'ICU': 20, 'General': 50, 'Emergency': 30, 'Pediatrics': 25,
        'Maternity': 20, 'Surgery': 15, 'Cardiology': 20,
        'Orthopedics': 20, 'Neurology': 15, 'Oncology': 15
    }

    for d in range(days):
        date   = base_date + timedelta(days=d)
        month  = date.month
        dow    = date.weekday()
        seasonal = 1.2 if month in [11, 12, 1, 2] else (0.85 if month in [6, 7, 8] else 1.0)

        for dept, capacity in dept_capacity.items():
            base_occ = 0.72
            occ_rate = min(0.98, base_occ * seasonal + rand.uniform(-0.05, 0.08))
            occupied = int(capacity * occ_rate)

            records.append({
                'date':          date.strftime('%Y-%m-%d'),
                'month':         month,
                'day_of_week':   date.strftime('%A'),
                'department':    dept,
                'total_beds':    capacity,
                'occupied':      occupied,
                'available':     capacity - occupied,
                'reserved':      rand.randint(0, 2),
                'maintenance':   rand.randint(0, 1),
                'occupancy_rate': round(occ_rate * 100, 1)
            })

    df = pd.DataFrame(records)
    print(f"✅ Bed usage: {len(df)} records")
    return df


def generate_equipment_usage(days: int = 180) -> pd.DataFrame:
    """Equipment utilization tracking over time."""
    records = []
    base_date = datetime.now() - timedelta(days=days)
    equip_config = {
        'Ventilator': {'base_util': 0.70, 'units': 30},
        'ECG Monitor': {'base_util': 0.65, 'units': 50},
        'Infusion Pump': {'base_util': 0.80, 'units': 80},
        'Defibrillator': {'base_util': 0.40, 'units': 20},
        'Ultrasound': {'base_util': 0.60, 'units': 15},
        'Pulse Oximeter': {'base_util': 0.75, 'units': 100}
    }

    for d in range(days):
        date  = base_date + timedelta(days=d)
        month = date.month
        seasonal = 1.15 if month in [11, 12, 1] else 1.0

        for equip, cfg in equip_config.items():
            for dept in rand.choice(DEPARTMENTS, size=rand.randint(3, 7), replace=False):
                util = min(0.99, cfg['base_util'] * seasonal + rand.normal(0, 0.07))
                util = max(0.1, util)
                dept_units = max(1, cfg['units'] // len(DEPARTMENTS))
                records.append({
                    'date':             date.strftime('%Y-%m-%d'),
                    'month':            month,
                    'equipment':        equip,
                    'department':       dept,
                    'total_units':      dept_units,
                    'units_in_use':     int(dept_units * util),
                    'utilization_rate': round(util * 100, 1),
                    'maintenance_flag': 1 if rand.random() < 0.05 else 0
                })

    df = pd.DataFrame(records)
    print(f"✅ Equipment usage: {len(df)} records")
    return df


def generate_staff_schedule(days: int = 90) -> pd.DataFrame:
    """Staff scheduling and shift coverage data."""
    records = []
    base_date = datetime.now() - timedelta(days=days)
    dept_staff = {dept: rand.randint(15, 35) for dept in DEPARTMENTS}

    for d in range(days):
        date = base_date + timedelta(days=d)
        dow  = date.weekday()
        for dept, total in dept_staff.items():
            for shift in SHIFTS:
                # Weekend/night shifts have fewer staff
                on_duty_pct = 0.65 if dow >= 5 or shift == 'night' else 0.80
                on_duty = int(total * on_duty_pct * rand.uniform(0.85, 1.0))
                records.append({
                    'date':         date.strftime('%Y-%m-%d'),
                    'day_of_week':  date.strftime('%A'),
                    'is_weekend':   1 if dow >= 5 else 0,
                    'department':   dept,
                    'shift':        shift,
                    'total_staff':  total,
                    'on_duty':      on_duty,
                    'on_leave':     rand.randint(0, 3),
                    'coverage_rate': round(on_duty / total * 100, 1),
                    'overtime_hours': rand.choice([0, 0, 0, 2, 4], p=[0.6, 0.15, 0.1, 0.1, 0.05])
                })

    df = pd.DataFrame(records)
    print(f"✅ Staff schedule: {len(df)} records")
    return df


def generate_all_datasets(output_dir: str = '/tmp/hospital_datasets') -> dict:
    """Generate and save all 4 CSV datasets."""
    os.makedirs(output_dir, exist_ok=True)

    datasets = {
        'patient_admissions': generate_patient_admissions(365),
        'bed_usage':          generate_bed_usage(365),
        'equipment_usage':    generate_equipment_usage(180),
        'staff_schedule':     generate_staff_schedule(90)
    }

    paths = {}
    for name, df in datasets.items():
        path = os.path.join(output_dir, f'{name}.csv')
        df.to_csv(path, index=False)
        paths[name] = path
        print(f"💾 Saved: {path}")

    print(f"\n🎉 All datasets generated in {output_dir}")
    return paths


if __name__ == '__main__':
    generate_all_datasets('./datasets')
