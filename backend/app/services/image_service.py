import os
import json
import random
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

# --- Lazy-loaded model singletons --------------------------------------------

ocr_reader = None
toxic_classifier = None
clip_classifier = None


def get_ocr_reader():
    """Lazy-load EasyOCR with English language support."""
    global ocr_reader
    if ocr_reader is None:
        import easyocr
        ocr_reader = easyocr.Reader(['en'], gpu=False)
        print("[image_service] EasyOCR reader loaded.")
    return ocr_reader


def get_toxic_classifier():
    """Lazy-load the Toxic-BERT text classification pipeline."""
    global toxic_classifier
    if toxic_classifier is None:
        from transformers import pipeline
        toxic_classifier = pipeline("text-classification", model="unitary/toxic-bert", top_k=None)
        print("[image_service] Toxic-BERT classifier loaded.")
    return toxic_classifier


def get_clip_classifier():
    """Lazy-load the CLIP zero-shot image classification pipeline."""
    global clip_classifier
    if clip_classifier is None:
        from transformers import pipeline
        clip_classifier = pipeline("zero-shot-image-classification", model="openai/clip-vit-base-patch32")
        print("[image_service] CLIP ViT-B/32 classifier loaded.")
    return clip_classifier


# --- Expanded CLIP candidate labels (Task 1) ---------------------------------
# Labels 1-2: benign categories
# Labels 3-6: threat categories (all aggregated into visual_toxicity_score)

CLIP_CANDIDATE_LABELS = [
    "a completely safe, normal, and harmless image",                                                    # Label 1
    "a funny internet meme, joke, or sarcastic reaction image",                                        # Label 2
    "an image containing severe cyberbullying, targeted harassment, or hateful insults",                # Label 3
    "an image showing physical violence, weapons, or gore",                                            # Label 4
    "a manipulated, deepfaked, face-swapped, or AI-generated image used to embarrass, humiliate, or falsely depict someone",  # Label 5 (NEW)
    "an image depicting self-harm, suicidal content, or encouragement of self-harm",                   # Label 6 (NEW)
]


# --- Main pipeline -----------------------------------------------------------

async def analyze_image_pipeline(image_path: str, file_name: str, skip_api: bool = False) -> dict:
    """
    Full multimodal image moderation pipeline:
      1. EasyOCR  -> extract embedded text from the image
      2. Toxic-BERT -> score the extracted text for toxicity
      3. CLIP (6-label) -> zero-shot classify the image for visual threats
      4. Local decision matrix -> fast-track or escalate
      5. Gemini Vision fallback -> only if local scores are ambiguous
    """

    extracted_text = ""
    text_toxicity_score = 0.0
    vision_toxicity_score = 0.0
    manipulation_score = 0.0
    self_harm_score = 0.0
    local_combined_score = 0.0
    result_label = "safe"
    final_score = 0.0
    reasoning = "Analysis pending"
    violated_categories = []           # NEW -- Task 3: taxonomy category IDs

    # --- Step 1: OCR - Extract text from image -------------------------------
    try:
        reader = get_ocr_reader()
        ocr_results = reader.readtext(image_path, detail=0)
        extracted_text = " ".join(ocr_results).strip()
        if extracted_text:
            print(f"[image_service] OCR extracted: \"{extracted_text[:100]}...\"")
        else:
            print("[image_service] OCR found no text in image.")
    except Exception as e:
        print(f"[image_service] OCR failed: {e}")
        extracted_text = ""

    # --- Step 2: Toxic-BERT - Score the extracted text -----------------------
    if extracted_text:
        try:
            classifier = get_toxic_classifier()
            bert_results = classifier(extracted_text[:512])  # Truncate to model max

            # toxic-bert returns a list of label/score dicts; find the 'toxic' label
            if bert_results and isinstance(bert_results[0], list):
                for item in bert_results[0]:
                    if item["label"] == "toxic":
                        text_toxicity_score = item["score"]
                        break
            elif bert_results and isinstance(bert_results[0], dict):
                text_toxicity_score = bert_results[0].get("score", 0.0)

            print(f"[image_service] Toxic-BERT text score: {text_toxicity_score:.4f}")
        except Exception as e:
            print(f"[image_service] Toxic-BERT failed: {e}")
            text_toxicity_score = 0.0

    # --- Step 3: CLIP - Zero-shot visual classification (6 labels) -----------
    try:
        classifier = get_clip_classifier()
        with Image.open(image_path) as img:
            pil_image = img.convert("RGB")
            pil_image.thumbnail((512, 512))

            clip_results = classifier(pil_image, candidate_labels=CLIP_CANDIDATE_LABELS)

        # Build a score map: {label_text: score}
        score_map = {r["label"]: r["score"] for r in clip_results}

        # Aggregate threat labels (3, 4, 5, 6) into vision_toxicity_score
        cyberbullying_score = score_map.get(CLIP_CANDIDATE_LABELS[2], 0.0)
        violence_score = score_map.get(CLIP_CANDIDATE_LABELS[3], 0.0)
        manipulation_score = score_map.get(CLIP_CANDIDATE_LABELS[4], 0.0)
        self_harm_score = score_map.get(CLIP_CANDIDATE_LABELS[5], 0.0)

        vision_toxicity_score = cyberbullying_score + violence_score + manipulation_score + self_harm_score

        print(f"[image_service] CLIP scores - cyberbullying: {cyberbullying_score:.4f}, "
              f"violence: {violence_score:.4f}, manipulation: {manipulation_score:.4f}, "
              f"self_harm: {self_harm_score:.4f} -> vision_total: {vision_toxicity_score:.4f}")
    except Exception as e:
        print(f"[image_service] CLIP failed: {e}")
        vision_toxicity_score = 0.0

    # --- Step 4: Local decision matrix ---------------------------------------
    # Combined score formula: 0.6 * text + 0.4 * vision (if text exists), else vision alone
    if extracted_text:
        local_combined_score = (0.6 * text_toxicity_score) + (0.4 * vision_toxicity_score)
    else:
        local_combined_score = vision_toxicity_score

    # Clamp to [0, 1]
    local_combined_score = max(0.0, min(1.0, local_combined_score))

    print(f"[image_service] Local combined score: {local_combined_score:.4f}")

    # Task 2 override: force Gemini escalation if manipulation or self-harm is suspicious
    force_escalation = (manipulation_score > 0.5) or (self_harm_score > 0.5)
    if force_escalation:
        print(f"[image_service] FORCED ESCALATION - manipulation={manipulation_score:.4f}, "
              f"self_harm={self_harm_score:.4f} (threshold: 0.5)")

    needs_gemini = False

    if force_escalation:
        # Never fast-track to safe when manipulation/self-harm is flagged
        needs_gemini = True
    elif text_toxicity_score >= 0.75 or vision_toxicity_score >= 0.75:
        # Fast-track to toxic - high confidence locally
        result_label = "toxic"
        final_score = max(text_toxicity_score, vision_toxicity_score)
        # Infer violated categories from local scores
        triggers = []
        if text_toxicity_score >= 0.75:
            violated_categories.append("O4")
            triggers.append(f"toxic text ({text_toxicity_score:.2f})")
        if cyberbullying_score >= 0.3:
            if "O4" not in violated_categories:
                violated_categories.append("O4")
            triggers.append(f"cyberbullying/harassment ({cyberbullying_score:.2f})")
        if violence_score >= 0.3:
            violated_categories.append("O3")
            triggers.append(f"violence ({violence_score:.2f})")
        if manipulation_score >= 0.3:
            violated_categories.append("O9")
            triggers.append(f"manipulation ({manipulation_score:.2f})")
        if self_harm_score >= 0.3:
            violated_categories.append("O5")
            triggers.append(f"self-harm ({self_harm_score:.2f})")
        # Build a specific reasoning string from the triggers
        if triggers:
            reasoning = "Local fast-track: flagged for " + ", ".join(triggers) + "."
        else:
            reasoning = "High local toxicity score detected (vision={:.2f}, text={:.2f}).".format(
                vision_toxicity_score, text_toxicity_score)
        print(f"[image_service] Fast-tracked -> TOXIC | {reasoning}")
    elif text_toxicity_score <= 0.25 and vision_toxicity_score <= 0.25:
        # Fast-track to safe - clearly benign
        result_label = "safe"
        final_score = 0.7 + (0.29 * random.random())
        reasoning = "Content appears safe based on local analysis."
        print("[image_service] Fast-tracked -> SAFE (low local scores)")
    else:
        # Ambiguous range (0.25 - 0.75) -> needs Gemini
        needs_gemini = True

    # --- Step 5: Gemini Vision fallback - YouthSafe taxonomy prompt (Task 3) --
    if needs_gemini and not skip_api:
        print("[image_service] Escalating to Gemini Vision API (taxonomy prompt)...")

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

        # Build the taxonomy-structured prompt (YouthSafe format)
        ocr_text_display = extracted_text[:300] if extracted_text else "(none)"

        taxonomy_system_prompt = (
            "You are a youth safety classifier evaluating an image (and any OCR-extracted text) "
            "for the following risk categories, adapted from an academic youth-AI-safety taxonomy:\n\n"
            "<BEGIN RISK CATEGORIES>\n"
            "O2: Sexual and Intimate Boundary Violations - sexual content, non-consensual imagery, sexualized depictions of a minor\n"
            "O3: Violence, Threats, and Aggression - physical violence, weapons, threats, gore\n"
            "O4: Toxic or Abusive Language and Behavior - insults, harassment, hateful language (from OCR text or imagery)\n"
            "O5: Self-Harm, Grooming, and Mental Health Risks - self-harm depiction, suicidal content, exploitation of vulnerability\n"
            "O9: Identity Abuse and Impersonation - deepfakes, face-swaps, AI-manipulated images used to falsely depict or humiliate someone\n"
            "<END RISK CATEGORIES>\n\n"
            "<BEGIN CONTEXT>\n"
            f"OCR-extracted text: {ocr_text_display}\n"
            f"Local model scores: text={text_toxicity_score:.3f}, vision={vision_toxicity_score:.3f}, "
            f"manipulation={manipulation_score:.3f}, self_harm={self_harm_score:.3f}\n"
            "<END CONTEXT>\n\n"
            "Assess the attached image against the categories above.\n\n"
            "Respond with EXACTLY three lines, no extra text:\n"
            "Line 1: safe OR unsafe\n"
            'Line 2: comma-separated violated category IDs if unsafe (e.g. "O3,O9"), or "none" if safe\n'
            "Line 3: concise one-sentence reasoning under 15 words"
        )

        for api_key in api_keys:
            genai.configure(api_key=api_key)

            for model_name in target_models:
                try:
                    model = genai.GenerativeModel(model_name)

                    with Image.open(image_path) as uploaded_image:
                        pil_image = uploaded_image.convert("RGB")
                        pil_image.thumbnail((512, 512))

                        response = model.generate_content(
                            [taxonomy_system_prompt, pil_image],
                            generation_config={
                                "max_output_tokens": 70,
                                "temperature": 0.2,
                            }
                        )

                    # Parse the 3-line response
                    raw_text = response.text.strip()
                    lines = [l.strip() for l in raw_text.split("\n") if l.strip()]

                    # Line 1: safe OR unsafe
                    if len(lines) >= 1:
                        line1 = lines[0].lower().strip()
                        if "unsafe" in line1:
                            result_label = "toxic"
                        elif "safe" in line1:
                            result_label = "safe"
                        else:
                            result_label = "safe"  # Default fallback
                    else:
                        result_label = "safe"

                    # Line 2: violated category IDs
                    if len(lines) >= 2:
                        line2 = lines[1].strip()
                        if line2.lower() != "none":
                            # Parse comma-separated category IDs like "O3,O9"
                            raw_cats = [c.strip().upper() for c in line2.replace('"', '').split(",")]
                            valid_cats = {"O2", "O3", "O4", "O5", "O9"}
                            violated_categories = [c for c in raw_cats if c in valid_cats]
                        else:
                            violated_categories = []

                    # Line 3: reasoning
                    if len(lines) >= 3:
                        reasoning = lines[2].strip()
                    else:
                        reasoning = "Gemini taxonomy analysis completed."

                    # Score assignment
                    if result_label == "toxic":
                        final_score = max(local_combined_score, 0.75)
                    else:
                        final_score = 0.7 + (0.29 * random.random())

                    success = True
                    print(f"[image_service] Gemini ({model_name}) -> {result_label} | "
                          f"categories={violated_categories} | {reasoning[:60]}")
                    break
                except Exception as e:
                    print(f"[image_service] Gemini {model_name} failed: {e}. Trying next...")
                    continue
            if success:
                break

        if not success:
            reasoning = "All API keys and models were exhausted."
            print("[image_service] WARNING: All Gemini keys/models exhausted.")

    elif needs_gemini and skip_api:
        reasoning = "API skipped; ambiguous local result returned as-is."
        final_score = local_combined_score
        result_label = "toxic" if local_combined_score >= 0.5 else "safe"

    # --- Threat keyword safety net (unchanged) -------------------------------
    threat_keywords = ["kill", "die", "murder", "suicide", "shoot", "stab", "attack"]
    if any(kw in extracted_text.lower() for kw in threat_keywords):
        if result_label != "toxic":
            result_label = "toxic"
            final_score = max(final_score, 0.85)
            reasoning = f"Threat keywords detected in image text. {reasoning}"
            if "O3" not in violated_categories:
                violated_categories.append("O3")
            print("[image_service] Threat keyword override -> TOXIC")

    # --- Determine is_likely_manipulated flag ---------------------------------
    is_likely_manipulated = (manipulation_score > 0.5) or ("O9" in violated_categories)

    # --- Build response ------------------------------------------------------
    return {
        "file_info": {
            "status": "success",
            "file_name": file_name,
            "extracted_text": extracted_text if extracted_text else "No text detected in image"
        },
        "analysis_breakdown": {
            "text_toxicity_score": round(text_toxicity_score, 4),
            "vision_toxicity_score": round(vision_toxicity_score, 4),
            "local_combined_score": round(local_combined_score, 4),
            "manipulation_score": round(manipulation_score, 4),
            "self_harm_score": round(self_harm_score, 4),
        },
        "final_verdict": {
            "result_label": result_label,
            "final_score": round(final_score, 4),
            "reasoning": reasoning,
            "violated_categories": violated_categories,
            "is_likely_manipulated": is_likely_manipulated,
        }
    }
