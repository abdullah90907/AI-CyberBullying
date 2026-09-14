from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime


class ChatMessageItem(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    history: List[ChatMessageItem] = []
    user_id: Optional[int] = 1


class ChatResponse(BaseModel):
    status: str
    response: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)


class ChatHistoryItem(BaseModel):
    id: int
    user_id: int
    message: str
    response: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
