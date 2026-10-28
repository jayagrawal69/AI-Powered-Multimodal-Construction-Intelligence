import json, os, base64, mimetypes
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
app = FastAPI(title="Construction Intelligence API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)
HISTORY = []
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "10"))

SYSTEM = """You are a construction decision-support assistant. Return valid JSON only with keys:
title (string), summary (string), risk_level (one of low, moderate, high, unknown),
findings (array of strings), recommendations (array of strings), limitations (array of strings).
Be cautious and explicit about uncertainty. Never certify a site as safe, diagnose structural integrity
from an image, or present a rough valuation as a formal appraisal. For images, describe only visible
evidence. Recommend a qualified professional for consequential decisions."""

FEATURES = {
    "safety": "Construction site safety review",
    "crack": "Crack / visible defect review",
    "valuation": "Illustrative real-estate valuation",
    "planning": "Construction project planning",
    "daily": "Daily site assistant",
    "weather": "Weather-aware site advisory",
    "knowledge": "Construction knowledge assistant",
}

def demo_result(feature: str, prompt: str, data: dict, has_image: bool):
    title = FEATURES.get(feature, "Construction intelligence result")
    notes = []
    recs = []
    risk = "unknown"
    if feature == "safety":
        risk = "moderate"
        notes = ["Demo mode is active; the uploaded image has not been interpreted by an AI model.",
                 "A human site supervisor should verify PPE, access routes, edge protection, housekeeping, and equipment separation."]
        recs = ["Pause work around any immediate hazard and follow the site's escalation procedure.",
                "Record the location, time, responsible supervisor, and corrective action.",
                "Have a competent safety officer perform and sign off the inspection."]
    elif feature == "crack":
        risk = "unknown"
        notes = ["Demo mode does not inspect the image or measure crack dimensions.",
                 "Crack width, depth, movement, location, and the structural element are not established."]
        recs = ["Photograph with a scale and record location/date for qualified review.",
                "Escalate promptly if cracking is widening, diagonal near openings/supports, accompanied by displacement, or associated with unusual sounds.",
                "Consult a qualified structural engineer; do not infer structural safety from this tool."]
    elif feature == "valuation":
        area = float(data.get("area_sqft") or 0)
        rate = float(data.get("rate_per_sqft") or 0)
        estimate = area * rate if area > 0 and rate > 0 else None
        risk = "unknown"
        notes = [f"Illustrative arithmetic estimate: {estimate:,.0f} (currency not specified)." if estimate is not None else "Enter a positive area and comparable rate per square foot to calculate an illustrative estimate.",
                 "This calculation does not account for location, title, condition, age, amenities, market liquidity, or legal encumbrances."]
        recs = ["Compare recent verified transactions for similar properties in the same micro-market.",
                "Have a licensed/qualified valuer assess the property for any formal or financial decision."]
    elif feature == "planning":
        risk = "moderate"
        notes = ["This is a starter plan; scope, site conditions, permits, procurement lead times, and crew capacity have not been verified."]
        recs = ["Define scope, drawings, bill of quantities, dependencies, and acceptance criteria.",
                "Sequence permits and procurement before dependent work packages.",
                "Run a daily safety briefing and weekly schedule/cost/risk review."]
    elif feature == "weather":
        weather = data.get("weather", "not provided")
        risk = "unknown"
        notes = [f"User-provided weather context: {weather}. No live forecast has been fetched."]
        recs = ["Check an official local forecast and site-specific alerts before scheduling exposed work.",
                "Follow manufacturer limits for concrete, coatings, lifting, and electrical work.",
                "Stop and escalate if lightning, high winds, flooding, or unsafe visibility affects the site."]
    elif feature == "daily":
        risk = "moderate"
        notes = ["No live project schedule, site log, or sensor data is connected."]
        recs = ["Start with a toolbox talk, weather check, permit review, and inspection of access/PPE.",
                "Confirm planned tasks, crew/equipment availability, material deliveries, and critical dependencies.",
                "Close the day with progress quantities, blockers, incidents/near misses, and next-day actions."]
    else:
        risk = "unknown"
        notes = ["Demo mode uses a safe generic response; it does not retrieve standards or project documents."]
        recs = ["Specify the construction system, jurisdiction, building type, and applicable standard.",
                "Verify technical requirements against current local codes and a qualified professional."]
    return {"title": title, "summary": "Demo result generated from the selected workflow. Enable model integration for AI-assisted text/image analysis.",
            "risk_level": risk, "findings": notes, "recommendations": recs,
            "limitations": ["Demo mode: no AI model analysis was performed.",
                            "This tool is not a substitute for licensed engineering, safety, valuation, or code review."]}

async def model_result(feature: str, prompt: str, data: dict, image_bytes: Optional[bytes], content_type: Optional[str]):
    from openai import OpenAI
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise HTTPException(status_code=503, detail="AI_PROVIDER=openai but OPENAI_API_KEY is not configured.")
    client = OpenAI(api_key=key)
    user_content = [{"type": "text", "text": f"Workflow: {FEATURES.get(feature, feature)}\nContext data: {json.dumps(data)}\nUser request: {prompt or 'Review the supplied context and provide a cautious assessment.'}"}]
    if image_bytes:
        mime = content_type or "image/jpeg"
        if not mime.startswith("image/"):
            raise HTTPException(status_code=415, detail="Uploaded file must be an image.")
        encoded = base64.b64encode(image_bytes).decode("ascii")
        user_content.append({"type": "image_url", "image_url": {"url": f"data:{mime};base64,{encoded}"}})
    response = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        messages=[{"role": "system", "content": SYSTEM}, {"role": "user", "content": user_content}],
        response_format={"type": "json_object"},
        temperature=0.2
    )
    try:
        result = json.loads(response.choices[0].message.content or "{}")
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Model returned invalid JSON.")
    required = {"title", "summary", "risk_level", "findings", "recommendations", "limitations"}
    if not required.issubset(result):
        raise HTTPException(status_code=502, detail="Model response did not match the required JSON contract.")
    if result["risk_level"] not in ["low", "moderate", "high", "unknown"]:
        result["risk_level"] = "unknown"
    return result

@app.get("/api/health")
def health():
    return {"status": "ok", "provider": os.getenv("AI_PROVIDER", "demo"), "features": list(FEATURES.keys())}

@app.get("/api/history")
def history():
    return {"items": HISTORY[-20:][::-1]}

@app.post("/api/analyze")
async def analyze(
    feature: str = Form(...),
    prompt: str = Form(""),
    data: str = Form("{}"),
    image: Optional[UploadFile] = File(None)
):
    if feature not in FEATURES:
        raise HTTPException(status_code=400, detail=f"Unknown feature. Choose from: {', '.join(FEATURES)}")
    try:
        parsed = json.loads(data or "{}")
        if not isinstance(parsed, dict):
            raise ValueError()
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(status_code=400, detail="data must be a JSON object.")
    image_bytes = None
    content_type = None
    if image:
        content_type = image.content_type
        if content_type and not content_type.startswith("image/"):
            raise HTTPException(status_code=415, detail="Upload an image file.")
        image_bytes = await image.read()
        if len(image_bytes) > MAX_UPLOAD_MB * 1024 * 1024:
            raise HTTPException(status_code=413, detail=f"Image exceeds {MAX_UPLOAD_MB} MB limit.")
    if os.getenv("AI_PROVIDER", "demo").lower() == "openai":
        result = await model_result(feature, prompt, parsed, image_bytes, content_type)
        mode = "openai"
    else:
        result = demo_result(feature, prompt, parsed, bool(image_bytes))
        mode = "demo"
    item = {"id": len(HISTORY) + 1, "feature": feature, "title": result.get("title", FEATURES[feature]),
            "created_at": datetime.now(timezone.utc).isoformat(), "mode": mode}
    HISTORY.append(item)
    return {"ok": True, "mode": mode, "result": result, "history_item": item}
