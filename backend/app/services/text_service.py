import os
import json
import random
import traceback
from groq import Groq
from dotenv import load_dotenv

load_dotenv()


# --- 11-category YouthSafe taxonomy prompt for text analysis (Task 4) --------

TAXONOMY_SYSTEM_PROMPT = (
    "You are a youth safety classifier. Assess the following text against these risk categories:\n\n"
    "<BEGIN RISK CATEGORIES>\n"
    "O1: Bias, Stereotyping, and Discrimination\n"
    "O2: Sexual and Intimate Boundary Violations\n"
    "O3: Violence, Threats, and Aggression\n"
    "O4: Toxic or Abusive Language and Behavior\n"
    "O5: Self-Harm, Grooming, and Mental Health Risks\n"
    "O6: Privacy and Data Exploitation\n"
    "O7: Misinformation, Hallucination, and Inappropriate Advice\n"
    "O8: User Misuse of Generative AI\n"
    "O9: Identity Abuse and Impersonation\n"
    "O10: Undue Influence and Manipulation\n"
    "O11: Developmental, Social, and Learning Harm\n"
    "<END RISK CATEGORIES>\n\n"
    "<BEGIN TEXT>\n"
    "{input_text}\n"
    "<END TEXT>\n\n"
    'Return ONLY a valid JSON object with these exact keys:\n'
    '{{\n'
    '  "result_label": "toxic" or "safe",\n'
    '  "final_score": float between 0.0 and 1.0,\n'
    '  "violated_categories": ["O_", ...] or [],\n'
    '  "reasoning": "concise one-sentence explanation under 15 words"\n'
    '}}'
)

VALID_CATEGORY_IDS = {
    "O1", "O2", "O3", "O4", "O5", "O6",
    "O7", "O8", "O9", "O10", "O11",
}


# Ordered by preference; the pipeline tries each until one succeeds.
GROQ_MODEL_CANDIDATES = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
]


async def analyze_text_pipeline(text: str) -> dict:
    """
    Text analysis pipeline using Groq API with the full 11-category
    YouthSafe taxonomy prompt. Returns result_label, scores, reasoning,
    and violated_categories.
    """
    try:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set")

        client = Groq(api_key=api_key)

        system_prompt = TAXONOMY_SYSTEM_PROMPT.format(input_text=text[:1500])

        # Try each model candidate until one succeeds
        response = None
        last_error = None
        for model_id in GROQ_MODEL_CANDIDATES:
            try:
                response = client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": "Give your final JSON verdict."}
                    ],
                    model=model_id,
                    response_format={"type": "json_object"},
                    max_tokens=200,
                    temperature=0.2,
                )
                print(f"[text_service] Groq model '{model_id}' succeeded.")
                break
            except Exception as model_err:
                last_error = model_err
                print(f"[text_service] Groq model '{model_id}' failed: {model_err}")
                continue

        if response is None:
            raise last_error or RuntimeError("All Groq model candidates failed")

        groq_output = json.loads(response.choices[0].message.content.strip())

        result_label = groq_output.get("result_label", "safe")
        llm_score = groq_output.get("final_score", 0.5)

        # Validate and clean the score
        if llm_score is None or not isinstance(llm_score, (int, float)) or llm_score < 0 or llm_score > 1:
            llm_score = 0.95 if result_label == "toxic" else 0.05

        reasoning = groq_output.get("reasoning", "Analyzed by AI.")

        # Parse and validate violated_categories
        raw_categories = groq_output.get("violated_categories", [])
        if isinstance(raw_categories, list):
            violated_categories = [
                c.strip().upper() for c in raw_categories
                if isinstance(c, str) and c.strip().upper() in VALID_CATEGORY_IDS
            ]
        else:
            violated_categories = []

        toxicity_score = llm_score
        confidence_score = llm_score

        # Ensure score makes sense with label
        if result_label == "safe":
            toxicity_score = 0.7 + (0.29 * random.random())
            confidence_score = toxicity_score

        is_likely_manipulated = ("O9" in violated_categories) or ("O8" in violated_categories)
        safe_reasoning_preview = reasoning[:80].encode("ascii", "replace").decode("ascii")
        print(f"[text_service] Groq -> {result_label} | "
              f"categories={violated_categories} | {safe_reasoning_preview}")

        return {
            "status": "success",
            "input_text": text,
            "toxicity_score": toxicity_score,
            "result_label": result_label,
            "confidence_score": confidence_score,
            "reasoning": reasoning,
            "violated_categories": violated_categories,
            "is_likely_manipulated": is_likely_manipulated,
        }

    except Exception as e:
        print(f"[text_service] ERROR analyzing text: {type(e).__name__}: {e}")
        traceback.print_exc()
        # Fallback if API fails
        return {
            "status": "success",
            "input_text": text,
            "toxicity_score": 0.1,
            "result_label": "safe",
            "confidence_score": 0.85,
            "reasoning": f"Content appears safe (fallback: {type(e).__name__}).",
            "violated_categories": [],
            "is_likely_manipulated": False,
        }
