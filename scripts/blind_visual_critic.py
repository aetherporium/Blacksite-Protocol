"""Run an isolated anonymous visual comparison; no project history or game names are sent to the model."""
import base64
import json
import os
from pathlib import Path

import requests


def image_data_url(path: str) -> str:
    image_path = Path(path)
    image_bytes = image_path.read_bytes()
    media_type = "image/jpeg" if image_path.suffix.lower() in {".jpg", ".jpeg"} else "image/png"
    return f"data:{media_type};base64," + base64.b64encode(image_bytes).decode("ascii")


def main() -> None:
    image_a = os.environ["BLIND_IMAGE_A"]
    image_b = os.environ["BLIND_IMAGE_B"]
    base_url = os.environ["OPENAI_API_BASE"].rstrip("/")
    api_key = os.environ["OPENAI_API_KEY"]
    rubric = """You are an independent visual-quality critic. You have no context about either image beyond the anonymous labels A and B. Compare two first-person shooter screenshots strictly as still images. Do not try to identify their games, creators, platforms, or source. Select the image with higher perceived rendering and presentation quality as a tactical FPS vertical slice. Judge material richness, lighting depth, geometric/environmental complexity, character and weapon silhouette quality, spatial composition, visual hierarchy, and HUD integration. Explicitly state that movement, animation, game feel, physics, and capability cannot be determined from a still image. Be harsh, concrete, and actionable. Output only JSON matching the schema."""
    schema = {
        "name": "blind_visual_comparison",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "winner": {"type": "string", "enum": ["A", "B", "tie"]},
                "confidence": {"type": "integer", "minimum": 0, "maximum": 100},
                "why_winner": {"type": "string"},
                "image_a_strengths": {"type": "array", "items": {"type": "string"}},
                "image_a_gaps": {"type": "array", "items": {"type": "string"}},
                "image_b_strengths": {"type": "array", "items": {"type": "string"}},
                "image_b_gaps": {"type": "array", "items": {"type": "string"}},
                "highest_impact_upgrades_for_loser": {"type": "array", "items": {"type": "string"}},
                "still_image_limitations": {"type": "string"}
            },
            "required": ["winner", "confidence", "why_winner", "image_a_strengths", "image_a_gaps", "image_b_strengths", "image_b_gaps", "highest_impact_upgrades_for_loser", "still_image_limitations"],
            "additionalProperties": False,
        },
    }
    payload = {
        "model": "claude-opus-4-7",
        "messages": [
            {"role": "system", "content": rubric},
            {"role": "user", "content": [
                {"type": "text", "text": "Anonymous Image A:"},
                {"type": "image_url", "image_url": {"url": image_data_url(image_a), "detail": "high"}},
                {"type": "text", "text": "Anonymous Image B:"},
                {"type": "image_url", "image_url": {"url": image_data_url(image_b), "detail": "high"}},
            ]},
        ],
        "max_tokens": 2800,
        "response_format": {"type": "json_schema", "json_schema": schema},
    }
    response = requests.post(
        f"{base_url}/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json=payload,
        timeout=180,
    )
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    print(json.dumps(json.loads(content), indent=2))


if __name__ == "__main__":
    main()
