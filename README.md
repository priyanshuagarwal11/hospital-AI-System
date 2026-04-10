# 🏥 MedOptima AI — Hospital Resource Optimization System

> **Hackathon-grade** full-stack AI application for intelligent hospital resource management.  
> Real-time bed tracking · ML-powered demand forecasting · Smart staff optimization · Automated alerts

![Stack](https://img.shields.io/badge/React-18-blue?logo=react)
![Stack](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![Stack](https://img.shields.io/badge/Python-FastAPI-red?logo=python)
![Stack](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen?logo=mongodb)
![Stack](https://img.shields.io/badge/ML-RandomForest-orange?logo=scikit-learn)

---

## 📋 Table of Contents

1. [Architecture](#architecture)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Setup Instructions](#setup-instructions)
5. [API Routes](#api-routes)
6. [AI/ML Models](#aiml-models)
7. [Dataset Generation](#dataset-generation)
8. [Deployment Guide](#deployment-guide)
9. [Screenshots](#screenshots)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MedOptima AI System                     │
├──────────────┬───────────────────────┬──────────────────────┤
│   Frontend   │       Backend         │    AI Microservice   │
│  React + Vite│   Node.js + Express   │   Python + FastAPI   │
│  Tailwind CSS│   REST API            │   Scikit-learn       │
│  Recharts    │   JWT Auth            │   Pandas/NumPy       │
│  Port: 5173  │   Port: 5000          │   Port: 8000         │
│              │         │             │                      │
│    Axios ────┼──► /api │ axios  ─────┼──► /predict/*        │
│              │         │             │                      │
│              │    MongoDB Atlas      │                      │
│              │    (Mongoose ODM)     │                      │
└──────────────┴──────────────────────┴──────────────────────┘
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **JWT Authentication** | Secure login/register with role-based access |
| 📊 **Live Dashboard** | Real-time KPIs – beds, staff, equipment, patients |
| 🛏️ **Bed Management** | Full CRUD with department-level occupancy tracking |
| ⚙️ **Equipment Tracking** | Utilization monitoring with shortage alerts |
| 👥 **Staff Scheduling** | Shift management with availability tracking |
| 🏥 **Patient Admissions** | Complete patient lifecycle with bed assignment |
| 🤖 **AI Predictions** | ML-powered forecasting for next 3/7/14 days |
| 💡 **Smart Recommendations** | Priority-ranked optimization suggestions |
| 🚨 **Alerts System** | Auto-generated alerts for critical resource shortages |
| 📄 **PDF Reports** | Professional downloadable hospital reports |
| 📊 **CSV Exports** | Data exports for all resource types |
| 📱 **Responsive UI** | Mobile-first design with dark theme |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite** – Fast modern UI
- **Tailwind CSS** – Utility-first styling (dark theme)
- **Recharts** – Interactive charts (Area, Bar, Pie, Line)
- **Axios** – API client with JWT interceptors
- **React Router v6** – Client-side routing
- **Lucide React** – Icon library

### Backend
- **Node.js** + **Express.js** – REST API
- **MongoDB** + **Mongoose** – Database & ODM
- **JSON Web Tokens** – Authentication
- **PDFKit** – Server-side PDF generation
- **json2csv** – CSV report generation
- **Helmet + Rate Limiter** – Security

### AI Microservice
- **FastAPI** – High-performance Python API
- **Scikit-learn** – Random Forest, Gradient Boosting, Ridge Regression
- **Pandas + NumPy** – Data processing
- **Ensemble Models** – RF 60% + GB 30% + LR 10%

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB (local or Atlas)
- Git

### Step 1: Clone & Install

```bash
git clone https://github.com/your-repo/hospital-ai-system.git
cd hospital-ai-system
```

### Step 2: Backend Setup

```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your MongoDB URI and JWT secret:
# MONGODB_URI=mongodb://localhost:27017/hospital_ai
# JWT_SECRET=your_super_secret_key_here
# AI_SERVICE_URL=http://localhost:8000

# Seed the database with demo data
npm run seed

# Start the backend
npm run dev
# → Running at http://localhost:5000
```

### Step 3: AI Microservice Setup

```bash
cd ../ai-service
python -m venv venv

# Activate virtual environment:
# Mac/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

pip install -r requirements.txt

# Start the AI service
uvicorn main:app --reload --port 8000
# → Running at http://localhost:8000
# → Docs at http://localhost:8000/docs
```

### Step 4: Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
# → Running at http://localhost:5173
```

### Step 5: Generate Datasets (Optional – for ML training)

```bash
cd ..
python generate_datasets.py
# → Creates ./datasets/*.csv files
```

### Default Login Credentials

| Email | Password | Role |
|---|---|---|
| admin@hospital.com | admin123 | Admin |
| doctor@hospital.com | admin123 | Doctor |

---

## 🔌 API Routes

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/me` | Get current user (protected) |

### Dashboard
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/dashboard/overview` | Full KPI overview |

### Beds
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/beds` | List all beds (filterable) |
| GET | `/api/beds/stats` | Bed statistics summary |
| POST | `/api/beds` | Create bed |
| GET | `/api/beds/:id` | Get single bed |
| PUT | `/api/beds/:id` | Update bed |
| DELETE | `/api/beds/:id` | Delete bed |

### Equipment
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/equipment` | List equipment |
| GET | `/api/equipment/stats` | Equipment statistics |
| POST | `/api/equipment` | Add equipment |
| PUT | `/api/equipment/:id` | Update equipment |
| DELETE | `/api/equipment/:id` | Delete equipment |

### Staff
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/staff` | List staff (filterable) |
| GET | `/api/staff/stats` | Staff statistics |
| POST | `/api/staff` | Add staff member |
| PUT | `/api/staff/:id` | Update staff |
| DELETE | `/api/staff/:id` | Deactivate staff |

### Patients
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/patients` | List patients |
| GET | `/api/patients/stats` | Patient statistics |
| POST | `/api/patients` | Admit patient |
| PUT | `/api/patients/:id` | Update patient (discharge etc.) |
| DELETE | `/api/patients/:id` | Delete patient record |

### Predictions (AI)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/predictions/beds?days=7` | Bed demand forecast |
| GET | `/api/predictions/equipment` | Equipment utilization forecast |
| GET | `/api/predictions/staff` | Staff requirement forecast |
| GET | `/api/predictions/recommendations` | Smart recommendations |

### Alerts
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/alerts` | List alerts (filterable) |
| POST | `/api/alerts` | Create alert |
| PUT | `/api/alerts/:id/read` | Mark alert as read |
| PUT | `/api/alerts/:id/resolve` | Resolve alert |
| PUT | `/api/alerts/mark-all-read` | Mark all as read |

### Reports
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/reports/pdf` | Download PDF report |
| GET | `/api/reports/csv?type=patients` | Download CSV |
| GET | `/api/reports/summary` | JSON summary for UI |

---

## 🤖 AI/ML Models

### 1. Bed Demand Predictor
- **Algorithm**: Ensemble (Random Forest 60% + Gradient Boosting 30% + Linear Regression 10%)
- **Features**: Day of week, month, lag features (1/7/14 days), rolling averages (3/7/14 day), trend, weekend flag
- **Output**: Daily predicted admissions with confidence intervals for up to 14 days

### 2. Equipment Utilization Predictor
- **Algorithm**: Ridge Regression + Rule-Based Risk Scoring
- **Features**: Current utilization rate, department, category, trend factor
- **Output**: Predicted utilization rate + risk level (critical/high/medium/low) per equipment

### 3. Staff Requirements Predictor
- **Algorithm**: Random Forest + Industry Staffing Ratios
- **Ratios**: ICU 1:1.5 (nurse:patient), General 1:4, Emergency 1:3
- **Output**: Required doctors/nurses/technicians per day per department

---

## 📊 Dataset Generation

The system generates 4 realistic CSV datasets with 365 days of data:

| File | Records | Description |
|------|---------|-------------|
| `patient_admissions.csv` | ~8,000 | Daily admissions with seasonal & weekly patterns |
| `bed_usage.csv` | ~3,650 | Daily bed occupancy per department |
| `equipment_usage.csv` | ~20,000 | Equipment utilization with maintenance flags |
| `staff_schedule.csv` | ~9,800 | Shift coverage per department |

```bash
python generate_datasets.py
```

---

## ☁️ Deployment Guide

### Deploy Backend → Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
cd backend
railway init
railway add  # Add MongoDB plugin
railway up
```

Set environment variables in Railway dashboard:
- `MONGODB_URI` → Railway MongoDB URL
- `JWT_SECRET` → strong random string
- `AI_SERVICE_URL` → your AI service URL

### Deploy AI Microservice → Railway / Render

```bash
# On Render: New Web Service
# Build command:  pip install -r requirements.txt
# Start command:  uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Deploy Frontend → Vercel

```bash
npm install -g vercel
cd frontend

# Set env variable:
# VITE_API_URL = https://your-backend.railway.app/api

vercel --prod
```

### Environment Variables Summary

| Service | Variable | Value |
|---------|----------|-------|
| Backend | `MONGODB_URI` | MongoDB connection string |
| Backend | `JWT_SECRET` | Random 32+ char string |
| Backend | `AI_SERVICE_URL` | AI microservice URL |
| Backend | `FRONTEND_URL` | Frontend URL for CORS |
| Frontend | `VITE_API_URL` | Backend API base URL |

---

## 📁 Project Structure

```
hospital-ai-system/
├── frontend/                    # React + Vite frontend
│   ├── src/
│   │   ├── api/index.js         # Axios API client
│   │   ├── context/AuthContext  # Auth state
│   │   ├── components/
│   │   │   ├── Layout/          # Sidebar, topbar
│   │   │   └── UI/              # Shared components
│   │   └── pages/
│   │       ├── LoginPage        # Authentication
│   │       ├── DashboardPage    # Main KPIs
│   │       ├── ResourcePage     # CRUD management
│   │       ├── PredictionPage   # AI forecasts
│   │       ├── AlertsPage       # Notifications
│   │       └── ReportsPage      # Reports & exports
│   └── package.json
│
├── backend/                     # Node.js + Express
│   ├── src/
│   │   ├── app.js               # Main entry point
│   │   ├── models/              # Mongoose schemas
│   │   ├── routes/              # REST API routes
│   │   ├── middleware/auth.js   # JWT middleware
│   │   └── utils/seedData.js   # Database seeder
│   └── package.json
│
├── ai-service/                  # Python FastAPI
│   ├── main.py                  # FastAPI application
│   ├── models/
│   │   ├── bed_predictor.py     # Random Forest model
│   │   ├── equipment_predictor  # Ridge Regression
│   │   └── staff_predictor.py   # RF + Ratios
│   ├── utils/data_generator.py  # CSV dataset generator
│   └── requirements.txt
│
├── generate_datasets.py         # Standalone CSV generator
└── README.md
```

---

## 🏆 Hackathon Highlights

- **Real AI/ML** – Actual trained ensemble models, not just mock data
- **Production-ready** – Rate limiting, JWT auth, error handling, validation
- **Graceful degradation** – Falls back to mock predictions if AI service is down  
- **Responsive design** – Works on mobile, tablet, desktop
- **Accessible** – Semantic HTML, proper focus states
- **Fast** – Vite for frontend, optimized MongoDB queries with indexes
- **Documented** – Comprehensive README + inline code comments

---

*Built with ❤️ for modern healthcare — MedOptima AI v1.0*
