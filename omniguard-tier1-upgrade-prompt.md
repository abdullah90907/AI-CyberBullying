# OmniGuard Tier 1 Upgrade — Implementation Prompt

Paste this whole document into your coding assistant (Claude Code, Cursor, etc.) run from inside the OmniGuard repo root. It has full context — no need to re-explain the codebase.

---

## Context

OmniGuard is a FastAPI + React cyberbullying detection app. It has three detection pipelines under `backend/app/`:

- `text_service.py` — Toxic-BERT locally, escalates ambiguous scores (0.01–0.99) to Groq `llama-3.3-70b-versatile`.
- `image_service.py` — EasyOCR + Toxic-BERT on extracted text, CLIP (`openai/clip-vit-base-patch32`) zero-shot on the image against 4 fixed candidate labels, escalates ambiguous combined scores (0.25–0.75) to Gemini Vision.
- `video_service.py` — samples 4 frames, routes each to the same Gemini fallback as images.

Goal of this task: align the detection taxonomy with the youth-safety research taxonomy from Yu et al. (YAIR / YouthSafe, ACM CCS 2025 & SOUPS 2025) — an 11-category, three-tier risk taxonomy purpose-built for youth-AI/youth-digital harm — and add visual detection categories for AI-manipulated/deepfake content, which the current 4-label CLIP setup cannot catch.

Do NOT change the cascading architecture (local model → ambiguous-range escalation → cloud fallback). Only change: (1) the CLIP candidate label set, (2) the system prompts sent to Groq and Gemini, (3) the response schema to carry the new taxonomy fields, (4) the local decision-matrix thresholds to account for the wider label set.

---

## Task 1 — Expand CLIP candidate labels in `image_service.py`

**Current state:** CLIP is run with exactly 4 candidate labels:
```python
candidate_labels = [
    "a completely safe, normal, and harmless image",
    "a funny internet meme, joke, or sarcastic reaction image",
    "an image containing severe cyberbullying, targeted harassment, or hateful insults",
    "an image showing physical violence, weapons, or gore",
]
```
Only labels 3 and 4 are aggregated into the visual toxicity score.

**Change to:**
```python
candidate_labels = [
    "a completely safe, normal, and harmless image",
    "a funny internet meme, joke, or sarcastic reaction image",
    "an image containing severe cyberbullying, targeted harassment, or hateful insults",
    "an image showing physical violence, weapons, or gore",
    "a manipulated, deepfaked, face-swapped, or AI-generated image used to embarrass, humiliate, or falsely depict someone",
    "an image depicting self-harm, suicidal content, or encouragement of self-harm",
]
```

Update the aggregation step: sum confidence scores for labels 3, 4, 5, and 6 (previously just 3 and 4) into `visual_toxicity_score`. Also compute and return two new sub-scores separately so they can be surfaced individually downstream:
- `manipulation_score` = confidence for label 5
- `self_harm_score` = confidence for label 6

Do not fold these into the combined score calculation differently than the existing labels — keep the existing `0.6 * text_score + 0.4 * visual_score` formula intact so you don't destabilize the existing threshold tuning. The new labels widen what `visual_score` can catch; they don't change how it's weighted.

---

## Task 2 — Update the local decision matrix thresholds

**Current state:** fast-track to `toxic` if text or vision score ≥ 0.75; fast-track to `safe` if both ≤ 0.25; otherwise escalate to Gemini.

**Change:** Add an explicit override — regardless of the combined score, if `manipulation_score` OR `self_harm_score` individually exceeds 0.5, force escalation to the Gemini fallback (never fast-track these to `safe`, even if the combined score would otherwise be low). This matters because a manipulated image can score low on the original 4 labels (it may not look overtly violent or contain insulting text) while still being exactly the kind of harm the taxonomy calls out. Reasoning: false negatives are more costly than false positives here — mirror the same precautionary bias YouthSafe's paper argues for.

---

## Task 3 — Rewrite the Gemini fallback prompt in `image_service.py`

Find the system prompt sent to Gemini when a combined score is ambiguous. Replace the current toxicity-only framing with a taxonomy-structured prompt modeled on YouthSafe's own training/eval format (their Table 2), adapted to your categories. Use this exact structure:

```
You are a youth safety classifier evaluating an image (and any OCR-extracted text) for the following risk categories, adapted from an academic youth-AI-safety taxonomy:

<BEGIN RISK CATEGORIES>
O2: Sexual and Intimate Boundary Violations — sexual content, non-consensual imagery, sexualized depictions of a minor
O3: Violence, Threats, and Aggression — physical violence, weapons, threats, gore
O4: Toxic or Abusive Language and Behavior — insults, harassment, hateful language (from OCR text or imagery)
O5: Self-Harm, Grooming, and Mental Health Risks — self-harm depiction, suicidal content, exploitation of vulnerability
O9: Identity Abuse and Impersonation — deepfakes, face-swaps, AI-manipulated images used to falsely depict or humiliate someone
<END RISK CATEGORIES>

<BEGIN CONTEXT>
OCR-extracted text: {ocr_text}
Local model scores: text={text_score}, vision={visual_score}, manipulation={manipulation_score}, self_harm={self_harm_score}
<END CONTEXT>

Assess the attached image against the categories above.

Respond with exactly three lines, no extra text:
Line 1: safe OR unsafe
Line 2: comma-separated violated category IDs if unsafe (e.g. "O3,O9"), or "none" if safe
Line 3: one-sentence reasoning
```

Parse line 2 into a `violated_categories: list[str]` field. Keep your existing threat-keyword post-processing check as an additional safety net on top of this, unchanged.

---

## Task 4 — Rewrite the Groq fallback prompt in `text_service.py`

**Current state:** prompts Groq for a generic `toxic`/`safe` JSON verdict.

**Change:** Use the same taxonomy-structured approach, but you can include the full 11-category set here since text has more categories to cover than images do:

```
You are a youth safety classifier. Assess the following text against these risk categories:

<BEGIN RISK CATEGORIES>
O1: Bias, Stereotyping, and Discrimination
O2: Sexual and Intimate Boundary Violations
O3: Violence, Threats, and Aggression
O4: Toxic or Abusive Language and Behavior
O5: Self-Harm, Grooming, and Mental Health Risks
O6: Privacy and Data Exploitation
O7: Misinformation, Hallucination, and Inappropriate Advice
O8: User Misuse of Generative AI
O9: Identity Abuse and Impersonation
O10: Undue Influence and Manipulation
O11: Developmental, Social, and Learning Harm
<END RISK CATEGORIES>

<BEGIN TEXT>
{input_text}
<END TEXT>

Return ONLY a valid JSON object with these exact keys:
{{
  "result_label": "toxic" or "safe",
  "final_score": float between 0.0 and 1.0,
  "violated_categories": ["O_", ...] or [],
  "reasoning": "one sentence explanation"
}}
```

Keep the existing post-processing (safe-score normalization to 0.7 + 0.29*random) unchanged — only the prompt and the new `violated_categories` field are new.

---

## Task 5 — Update Pydantic response schemas

Find `DetectionResponse` (text) and the image/video equivalent response models (likely in `backend/app/schemas.py` or similar). Add these fields to both:

```python
violated_categories: list[str] = []
is_likely_manipulated: bool = False   # image/video responses only
```

Set `is_likely_manipulated = True` whenever `manipulation_score` from Task 1 exceeds 0.5, OR when Gemini's `violated_categories` includes `"O9"`. Populate `violated_categories` from whichever pipeline stage produced the final verdict (Groq JSON parse for text, Gemini line-2 parse for images).

---

## Task 6 — (Optional, do only if time allows) Surface it in the frontend

In the results card component(s) under the React app, render `violated_categories` as small tags/chips next to the existing toxicity score, and show a distinct badge (e.g. "⚠ Possible AI manipulation") when `is_likely_manipulated` is true. This is cosmetic and can be skipped if you're short on time before the meeting — the backend changes above are what matter for the demo and the report.

---

## Testing checklist

Run these manually after implementing:

1. **Text, clear category test:** submit a message with an obvious O10 (manipulation) pattern, e.g. "if you tell your parents I'll never talk to you again" — confirm `violated_categories` includes `O10`.
2. **Image, manipulation-only test:** find or mock a clearly edited/composited image with no overt violence or nudity — confirm it does NOT get fast-tracked as safe, and that Gemini escalation triggers.
3. **Image, self-harm test:** use a benign stock image tagged for testing self-harm-adjacent content (do NOT use real self-harm imagery) — confirm the new CLIP label picks up a nonzero `self_harm_score`.
4. **Regression check:** re-run your existing test cases (the "you are absolute garbage..." text case, the login flow) to confirm nothing in the old pipeline broke.
5. **Schema check:** confirm the API responses now include `violated_categories` and (for images) `is_likely_manipulated` with correct defaults when nothing is flagged.

---

## Deliverable for the meeting

After this is done, write a short before/after comparison (2-3 sentences + one example) showing: "here's a case our old 4-label CLIP setup would have missed, and here's the new taxonomy-aware pipeline catching it." That comparison — not the code itself — is the artifact worth bringing to the professor.
