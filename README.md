# AI-Powered Multimodal Construction Intelligence Platform

A runnable full-stack starter project with a React + Vite frontend and FastAPI backend.

## Included modules
- Site safety review (image upload + contextual notes)
- Crack inspection (image upload + severity-oriented checklist)
- Real-estate valuation estimate (structured property inputs)
- Construction project planning
- Daily site assistant
- Weather-aware advisory (uses user-provided weather; no live weather API required)
- Construction knowledge assistant
- JSON API contracts and a simple activity history

**Important:** This project runs in `demo mode` by default. Demo outputs are clearly labeled as simulated and must not be used as professional engineering, safety, valuation, or legal advice. Image analysis is not truly performed in demo mode. To enable model-backed analysis, configure an OpenAI API key and set `AI_PROVIDER=openai`; see `.env.example`.

## Requirements
- Python 3.10+
- Node.js 18+

## Run on Windows (PowerShell)

### 1. Start backend
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```
Backend: http://127.0.0.1:8000  
API docs: http://127.0.0.1:8000/docs

### 2. Start frontend in a second terminal
```powershell
cd frontend
npm install
npm run dev
```
Open the local URL printed by Vite (usually http://localhost:5173).

## Run on macOS/Linux
Backend:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```
Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Enable OpenAI model integration (optional)
1. Put your key in `backend/.env` as `OPENAI_API_KEY=...`.
2. Set `AI_PROVIDER=openai`.
3. Install dependencies (already included).
4. Restart FastAPI.

The backend uses a vision-capable model for image workflows and JSON-shaped outputs. Model names can be changed with `OPENAI_MODEL` in `.env`. Keep API keys on the backend only—never put them in frontend environment variables.

## API endpoints
- `GET /api/health`
- `POST /api/analyze` (multipart form: `feature`, `prompt`, optional `image`, optional `data` JSON string)
- `GET /api/history`

## Safety / limitations
- Outputs are decision-support suggestions, not certified inspections or professional advice.
- Do not rely on the tool to declare a site safe, diagnose structural integrity, or replace a qualified engineer/safety officer.
- Valuation is a rough illustrative estimate; it is not a formal appraisal.
- Weather advisory uses only weather data entered by the user. No live forecast service is connected.
