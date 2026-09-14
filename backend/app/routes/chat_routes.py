from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from backend.app.schemas.chat_schemas import ChatRequest, ChatResponse, ChatHistoryItem
from backend.app.services.chat_service import generate_chat_response
from backend.app.database.config import get_db
from backend.app.models import ChatHistory

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        history_list = [h.model_dump() for h in request.history]
        ai_reply = await generate_chat_response(request.message, history_list)

        user_id = request.user_id or 1
        db_chat = ChatHistory(
            user_id=user_id,
            message=request.message,
            response=ai_reply
        )
        db.add(db_chat)
        db.commit()
        db.refresh(db_chat)

        return ChatResponse(status="success", response=ai_reply)
    except Exception as e:
        print(f"[chat_routes] Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{user_id}", response_model=List[ChatHistoryItem])
def get_user_chat_history(user_id: int, db: Session = Depends(get_db)):
    try:
        history = (
            db.query(ChatHistory)
            .filter(ChatHistory.user_id == user_id)
            .order_by(ChatHistory.created_at.asc())
            .limit(50)
            .all()
        )
        return history
    except Exception as e:
        print(f"[chat_routes] Error fetching history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
