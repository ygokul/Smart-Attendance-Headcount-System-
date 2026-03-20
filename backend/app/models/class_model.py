from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId
from app.models.user import PyObjectId

class Period(BaseModel):
    period_no: int
    subject: str
    start_time: str # HH:MM format
    end_time: str # HH:MM format
    faculty_id: Optional[str] = None 

class DaySchedule(BaseModel):
    day: str # Monday, Tuesday...
    periods: List[Period] = []

class ClassModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str # e.g. "CS-A"
    department: str
    academic_year: str
    schedule: List[DaySchedule] = []
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
