from pydantic import BaseModel
from typing import Optional

class TimeSlot(BaseModel):
    start: str = "08:00"
    end: str = "08:30"

class RoleTimings(BaseModel):
    morning: TimeSlot
    lunch: Optional[TimeSlot] = None
    out_time: Optional[TimeSlot] = None

class Settings(BaseModel):
    student: RoleTimings
    faculty: RoleTimings

# Default Settings
def get_default_settings():
    return Settings(
        student=RoleTimings(
            morning=TimeSlot(start="08:00", end="08:30"),
            lunch=TimeSlot(start="13:00", end="13:30")
        ),
        faculty=RoleTimings(
            morning=TimeSlot(start="08:00", end="08:30"),
            lunch=None,
            out_time=TimeSlot(start="17:00", end="18:00")
        )
    )
