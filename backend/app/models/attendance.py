from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId
from app.models.user import PyObjectId

class Attendance(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    student_id: PyObjectId
    date: str # YYYY-MM-DD
    period: int
    subject: str
    status: str # present, absent, late
    timestamp: datetime
    out_time: Optional[datetime] = None
    confidence: float

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}
