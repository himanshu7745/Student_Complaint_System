import base64
import io
import json
import random
import string
import time
from typing import Any

import requests
from PIL import Image


API_URL = "http://127.0.0.1:8000/complaintFeatures"

CLASS_TEXTS = [
    "safety hazard",
    "maintenance",
    "discipline",
    "academic issue",
    "harassment",
    "bullying",
    "infrastructure",
    "cleanliness",
    "administrative",
    "other",
]


def _random_text(prefix: str, min_words: int = 5, max_words: int = 12) -> str:
    word_count = random.randint(min_words, max_words)
    words = []
    for _ in range(word_count):
        size = random.randint(3, 10)
        words.append("".join(random.choices(string.ascii_lowercase, k=size)))
    return f"{prefix}: {' '.join(words)}"


def _random_base64_image(width: int = 64, height: int = 64) -> str:
    img = Image.new(
        "RGB",
        (width, height),
        (
            random.randint(0, 255),
            random.randint(0, 255),
            random.randint(0, 255),
        ),
    )
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def build_dummy_payload(num_items: int = 2, with_images: bool = True) -> dict[str, Any]:
    items = []
    for _ in range(num_items):
        item = {
            "title": _random_text("Complaint title", min_words=2, max_words=6),
            "description": _random_text("Complaint description", min_words=10, max_words=20),
        }
        if with_images:
            item["images"] = [_random_base64_image() for _ in range(random.randint(1, 3))]
        items.append(item)

    return {
        "items": items,
        "class_texts": CLASS_TEXTS,
        "temperature": 1.0,
    }


def wait_for_api(timeout_seconds: int = 45) -> None:
    start = time.time()
    while True:
        try:
            response = requests.get("http://127.0.0.1:8000/docs", timeout=2)
            if response.status_code == 200:
                return
        except requests.RequestException:
            pass

        if time.time() - start > timeout_seconds:
            raise TimeoutError("API did not become available in time. Start uvicorn before running this script.")
        time.sleep(1)


def validate_response(response_json: dict[str, Any], expected_count: int) -> None:
    if "predictions" not in response_json:
        raise AssertionError("Missing 'predictions' in response")

    predictions = response_json["predictions"]
    if not isinstance(predictions, list):
        raise AssertionError("'predictions' must be a list")
    if len(predictions) != expected_count:
        raise AssertionError(f"Expected {expected_count} predictions, got {len(predictions)}")

    required_keys = {"severity", "pred_idx", "pred_label", "logits", "probs"}
    for i, pred in enumerate(predictions):
        if not isinstance(pred, dict):
            raise AssertionError(f"Prediction at index {i} is not a dictionary")
        missing = required_keys.difference(pred.keys())
        if missing:
            raise AssertionError(f"Prediction at index {i} is missing keys: {sorted(missing)}")

        severity = pred["severity"]
        if not isinstance(severity, (int, float)):
            raise AssertionError(f"Prediction {i} has invalid severity type: {type(severity)}")
        if not (1.0 <= float(severity) <= 10.0):
            raise AssertionError(f"Prediction {i} severity out of range [1,10]: {severity}")

        pred_idx = pred["pred_idx"]
        if not isinstance(pred_idx, int):
            raise AssertionError(f"Prediction {i} has invalid pred_idx type: {type(pred_idx)}")
        if not (0 <= pred_idx < len(CLASS_TEXTS)):
            raise AssertionError(f"Prediction {i} pred_idx out of bounds: {pred_idx}")

        for vec_key in ("logits", "probs"):
            vec = pred[vec_key]
            if not isinstance(vec, list):
                raise AssertionError(f"Prediction {i} field '{vec_key}' must be a list")
            if len(vec) != len(CLASS_TEXTS):
                raise AssertionError(
                    f"Prediction {i} field '{vec_key}' length mismatch: expected {len(CLASS_TEXTS)}, got {len(vec)}"
                )


def main() -> None:
    print("Waiting for API to be available...")
    wait_for_api()

    payload_with_images = build_dummy_payload(num_items=2, with_images=True)
    print("Sending request with images to /complaintFeatures...")

    response_with_images = requests.request("GET", API_URL, json=payload_with_images, timeout=120)
    print("Status (with images):", response_with_images.status_code)

    if response_with_images.status_code != 200:
        raise AssertionError(
            f"Expected status 200 for with-images request, got {response_with_images.status_code}. "
            f"Body: {response_with_images.text}"
        )

    response_json_with_images = response_with_images.json()
    validate_response(response_json_with_images, expected_count=len(payload_with_images["items"]))
    print("With-images response validated successfully.")

    payload_no_images = build_dummy_payload(num_items=2, with_images=False)
    print("Sending request with NO images to /complaintFeatures...")

    response_no_images = requests.request("GET", API_URL, json=payload_no_images, timeout=120)
    print("Status (no images):", response_no_images.status_code)

    if response_no_images.status_code != 200:
        raise AssertionError(
            f"Expected status 200 for no-images request, got {response_no_images.status_code}. "
            f"Body: {response_no_images.text}"
        )

    response_json_no_images = response_no_images.json()
    validate_response(response_json_no_images, expected_count=len(payload_no_images["items"]))
    print("No-images response validated successfully.")

    print("Both scenarios passed.")
    print("Sample response (no images):")
    print(json.dumps(response_json_no_images, indent=2)[:2500])


if __name__ == "__main__":
    main()
