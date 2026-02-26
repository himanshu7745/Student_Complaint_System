import base64
import io
from typing import List

from fastapi import Body, FastAPI, HTTPException
from pydantic import BaseModel, Field

from complaint_features.clip_multimodal_model import CLIPSeverityClassifier, predict_from_items


app = FastAPI(title="Student Complaint Features API", version="1.0.0")


# Default 10 class prompts (override in request if needed)
DEFAULT_CLASS_TEXTS = [
    "hostel",
    "electrical",
    "internet",
    "sanitation",
    "classroom",
    "security",
    "administration",
    "plumbing",
    "harassment",
    "transport",
    "other"
]


class ComplaintItem(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    images: List[str] | None = Field(
        default=None,
        description="List of base64-encoded image strings",
    )


class ComplaintFeaturesRequest(BaseModel):
    items: List[ComplaintItem] = Field(..., min_length=1)
    class_texts: List[str] = Field(default_factory=lambda: DEFAULT_CLASS_TEXTS.copy())
    temperature: float = Field(default=1.0, gt=0.0)


class ComplaintPrediction(BaseModel):
    severity: float
    pred_idx: int
    pred_label: str
    logits: List[float]
    probs: List[float]


class ComplaintFeaturesResponse(BaseModel):
    predictions: List[ComplaintPrediction]


model = CLIPSeverityClassifier()


def _decode_base64_to_bytesio(image_b64: str) -> io.BytesIO:
    try:
        if "," in image_b64 and "base64" in image_b64:
            image_b64 = image_b64.split(",", 1)[1]
        raw = base64.b64decode(image_b64, validate=True)
        return io.BytesIO(raw)
    except Exception as exc:
        raise ValueError("Invalid base64 image string") from exc


@app.get("/complaintFeatures", response_model=ComplaintFeaturesResponse)
def complaint_features(payload: ComplaintFeaturesRequest = Body(...)) -> ComplaintFeaturesResponse:
    try:
        items_for_model: list[dict] = []
        for item in payload.items:
            image_streams = []
            if item.images:
                image_streams = [_decode_base64_to_bytesio(img_str) for img_str in item.images]
            items_for_model.append(
                {
                    "title": item.title,
                    "description": item.description,
                    "images": image_streams,
                }
            )

        predictions = predict_from_items(
            model=model,
            items=items_for_model,
            class_texts=payload.class_texts,
            temperature=payload.temperature,
        )
        return ComplaintFeaturesResponse(predictions=predictions)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc
