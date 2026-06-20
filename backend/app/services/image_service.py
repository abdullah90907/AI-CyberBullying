import os
import json
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

async def analyze_image_pipeline(image_path: str, file_name: str, skip_api: bool = False) -> dict:
    extracted_text = "Processed via Gemini Vision"
    result_label = "safe"
    final_score = 0.0
    reasoning = "Gemini analysis unavailable"

    if skip_api:
        reasoning = "API skipped; no Gemini analysis"
        return {
            "file_info": {
                "status": "success",
                "file_name": file_name,
                "extracted_text": extracted_text
            },
            "analysis_breakdown": {
                "text_toxicity_score": 0.0,
                "vision_toxicity_score": 0.0,
                "local_combined_score": 0.0
            },
            "final_verdict": {
                "result_label": result_label,
                "final_score": final_score,
                "reasoning": reasoning
            }
        }

    target_models = [
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash-lite",
        "gemini-3-flash",
        "gemini-3.5-flash",
        "gemini-2.5-flash"
    ]

    api_keys = []
    base_key = os.getenv("GEMINI_API_KEY")
    if base_key:
        api_keys.append(base_key)
    for i in range(1, 21):
        key = os.getenv(f"GEMINI_API_KEY_{i}")
        if key:
            api_keys.append(key)

    success = False

    for api_key in api_keys:
        genai.configure(api_key=api_key)

        for model_name in target_models:
            try:
                model = genai.GenerativeModel(model_name)

                system_prompt = (
                    "You are a strict cyberbullying detection AI. "
                    "Analyze the provided image only, including any readable text inside it. "
                    "Return valid JSON with exactly three keys: "
                    '"result_label" (strictly "toxic" or "safe"), '
                    '"final_score" (a float between 0.0 and 1.0), '
                    'and "reasoning" (extremely brief, maximum 5 to 7 words).'
                )

                with Image.open(image_path) as uploaded_image:
                    pil_image = uploaded_image.convert("RGB")
                    pil_image.thumbnail((512, 512))

                    prompt = (
                        "Detect cyberbullying, harassment, threats, insults, or hateful content in this image. "
                        "Read any visible text in the image and weigh it carefully. "
                        "If the image is harmless, return safe. "
                        "Respond only with JSON containing exactly these keys: "
                        '"result_label", "final_score", and "reasoning".'
                    )

                    response = model.generate_content(
                        [system_prompt, pil_image, prompt],
                        generation_config={"response_mime_type": "application/json"}
                    )

                gemini_output = json.loads(response.text.strip())

                parsed_label = str(gemini_output.get("result_label", result_label)).strip().lower()
                if parsed_label not in {"toxic", "safe"}:
                    parsed_label = "safe"

                try:
                    parsed_score = float(gemini_output.get("final_score", final_score))
                except (TypeError, ValueError):
                    parsed_score = final_score
                final_score = max(0.0, min(1.0, parsed_score))

                parsed_reasoning = str(gemini_output.get("reasoning", reasoning)).strip()
                reasoning = parsed_reasoning[:120] if parsed_reasoning else "Gemini analysis completed"
                result_label = parsed_label
                success = True
                break
            except Exception as e:
                print(f"Model {model_name} failed: {e}. Shifting to next model.")
                continue
        if success:
            break

    if not success:
        reasoning = "All API keys and models were exhausted."

    return {
        "file_info": {
            "status": "success",
            "file_name": file_name,
            "extracted_text": extracted_text
        },
        "analysis_breakdown": {
            "text_toxicity_score": 0.0,
            "vision_toxicity_score": 0.0,
            "local_combined_score": 0.0
        },
        "final_verdict": {
            "result_label": result_label,
            "final_score": final_score,
            "reasoning": reasoning
        }
    }
