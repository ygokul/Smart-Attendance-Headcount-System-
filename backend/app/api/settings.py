from fastapi import APIRouter, Body
from app.core.database import db
from app.models.settings import Settings, get_default_settings

router = APIRouter()

@router.get("/", response_description="Get attendance settings")
async def get_settings():
    settings_data = await db.get_db()["settings"].find_one({"_id": "global_settings"})
    if settings_data:
        return settings_data
    
    # Return defaults if not set
    return get_default_settings()

@router.put("/", response_description="Update attendance settings")
async def update_settings(settings: Settings = Body(...)):
    new_settings = settings.dict()
    new_settings["_id"] = "global_settings"
    
    await db.get_db()["settings"].replace_one(
        {"_id": "global_settings"},
        new_settings,
        upsert=True
    )
    return settings
