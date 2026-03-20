from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.models.pyobjectid import PyObjectId
from bson import ObjectId

class PendingAttendance(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: PyObjectId
    user_name: str
    role: str
    timestamp: datetime
    confidence: float
    status: str = "pending" # pending, approved, rejected

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
