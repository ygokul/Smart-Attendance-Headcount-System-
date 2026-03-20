from fastapi import APIRouter, HTTPException, Body, status
from fastapi.encoders import jsonable_encoder
from typing import List

from app.models.user import UserCreate, UserInDB
from app.core.database import db

router = APIRouter()

from app.services.auth_service import auth_service

@router.post("/", response_description="Add new user", response_model=UserInDB)
async def create_user(user: UserCreate = Body(...)):
    user_data = jsonable_encoder(user)
    
    # Hash password if provided
    if user.password:
        user_data["hashed_password"] = auth_service.get_password_hash(user.password)
        del user_data["password"]
    
    # Basic validation: check if email or ID exists
    # For now, just insert
    new_user = await db.get_db()["users"].insert_one(user_data)
    created_user = await db.get_db()["users"].find_one({"_id": new_user.inserted_id})
    return created_user

@router.get("/", response_description="List all users", response_model=List[UserInDB])
async def list_users():
    users = await db.get_db()["users"].find().to_list(1000)
    return users

from bson import ObjectId
from bson.errors import InvalidId

@router.delete("/{id}", response_description="Delete a user")
async def delete_user(id: str):
    try:
        oid = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="User not found")
        
    delete_result = await db.get_db()["users"].delete_one({"_id": oid})

    if delete_result.deleted_count == 1:
        return {"message": "User deleted successfully"}

    raise HTTPException(status_code=404, detail="User not found")

@router.put("/{id}", response_description="Update a user", response_model=UserInDB)
async def update_user(id: str, user: UserCreate = Body(...)):
    try:
        oid = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = {k: v for k, v in user.dict().items() if v is not None}
    
    if "password" in user_data:
         if user_data["password"]:
             user_data["hashed_password"] = auth_service.get_password_hash(user_data["password"])
         del user_data["password"]
    
    # Prevent _id from being updated if it's in the body
    if "_id" in user_data:
        del user_data["_id"]

    if len(user_data) >= 1:
        update_result = await db.get_db()["users"].update_one(
            {"_id": oid}, {"$set": user_data}
        )

        if update_result.modified_count == 1:
            updated_user = await db.get_db()["users"].find_one({"_id": oid})
            if updated_user:
                return updated_user

    existing_user = await db.get_db()["users"].find_one({"_id": oid})
    if existing_user:
        return existing_user

    raise HTTPException(status_code=404, detail="User not found")