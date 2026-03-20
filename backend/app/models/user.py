from pydantic import BaseModel, Field, EmailStr, BeforeValidator
from typing import List, Optional, Annotated
from bson import ObjectId
from datetime import datetime

PyObjectId = Annotated[str, BeforeValidator(str)]

class UserBase(BaseModel):
    name: str = Field(..., min_length=2)
    role: str = Field(..., pattern="^(admin|student|faculty)$")
    email: Optional[EmailStr] = None

class UserCreate(UserBase):
    roll_no: Optional[str] = None
    emp_id: Optional[str] = None
    department: Optional[str] = None
    class_section: Optional[str] = None
    designation: Optional[str] = None
    academic_year: Optional[str] = None
    password: Optional[str] = None # Plain text for creation (hashed later)

class UserInDB(UserCreate):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    hashed_password: Optional[str] = None
    face_embeddings: List[List[float]] = [] 
    created_at: datetime = Field(default_factory=datetime.now)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
