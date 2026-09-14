import os
import traceback
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# System prompt for OmniGuard AI assistant (balanced token budget & clean formatting)
CHATBOT_SYSTEM_PROMPT = (
    "You are the OmniGuard AI Assistant, a supportive, expert guide in youth cyber-safety and online wellness.\n\n"
    "Strict Rules:\n"
    "1. Keep responses concise, direct, and balanced (between 70 to 110 words).\n"
    "2. ALWAYS complete your final sentence. Do not start sections or lists you cannot finish within the limit.\n"
    "3. Use clean bullet points (- ) or numbered steps (1. ) for actionable advice.\n"
    "4. Highlight key terms with bolding (**like this**).\n"
    "5. If a user is facing cyberbullying or distress, give warm reassurance and 2-3 immediate safety steps "
    "(save evidence, block the sender, tell a trusted adult/counselor).\n"
    "6. If asked about OmniGuard tools (Text, Image, Video, Reports), explain them concisely."
)

GROQ_MODEL_CANDIDATES = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
]


async def generate_chat_response(user_message: str, history: list = None) -> str:
    """
    Generates an AI response for the OmniGuard Chatbot using Groq with model fallback.
    """
    history = history or []
    
    # Build messages list
    messages = [{"role": "system", "content": CHATBOT_SYSTEM_PROMPT}]
    
    # Add up to 4 recent history turns for lean context
    for turn in history[-4:]:
        role = turn.get("role")
        content = turn.get("content")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
            
    messages.append({"role": "user", "content": user_message})

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return (
            "I'm here to support you! Remember: if you face online harassment, save evidence, "
            "block the sender, and speak with a trusted adult or counselor."
        )

    client = Groq(api_key=api_key)

    for model_id in GROQ_MODEL_CANDIDATES:
        try:
            response = client.chat.completions.create(
                messages=messages,
                model=model_id,
                max_tokens=260,
                temperature=0.5,
            )
            reply = response.choices[0].message.content.strip()
            if reply:
                return reply
        except Exception as e:
            print(f"[chat_service] Groq model {model_id} error: {e}")
            continue

    # Fallback to Gemini if Groq is unavailable
    try:
        import google.generativeai as genai
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key:
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            gemini_prompt = f"{CHATBOT_SYSTEM_PROMPT}\n\nUser: {user_message}\nAssistant:"
            res = model.generate_content(gemini_prompt)
            if res.text:
                return res.text.strip()
    except Exception as gemini_err:
        print(f"[chat_service] Gemini fallback error: {gemini_err}")

    return (
        "Thank you for reaching out. I am OmniGuard's safety assistant. "
        "If you are experiencing harassment or need help using our detection tools, "
        "please try again in a moment or visit our Text, Image, or Video analysis pages."
    )
