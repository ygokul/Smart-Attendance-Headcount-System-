from pydantic import BaseModel, Field
from typing import Optional
from typing_extensions import Annotated
from pydantic import BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

class Department(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str # e.g. "Computer Science"
    code: str # e.g. "CSE"

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
