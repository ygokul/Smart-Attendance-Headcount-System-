from fastapi import APIRouter, HTTPException, Body, status
from fastapi.encoders import jsonable_encoder
from typing import List
from bson import ObjectId
from bson.errors import InvalidId

from app.models.class_model import ClassModel
from app.core.database import db

router = APIRouter()

@router.post("/", response_description="Create new class", response_model=ClassModel)
async def create_class(class_obj: ClassModel = Body(...)):
    class_data = jsonable_encoder(class_obj)
    if "_id" in class_data and class_data["_id"] is None:
        del class_data["_id"]
    new_class = await db.get_db()["classes"].insert_one(class_data)
    created_class = await db.get_db()["classes"].find_one({"_id": new_class.inserted_id})
    return created_class

@router.get("/", response_description="List all classes", response_model=List[ClassModel])
async def list_classes():
    classes = await db.get_db()["classes"].find().to_list(100)
    return classes

@router.get("/{id}", response_description="Get a single class", response_model=ClassModel)
async def show_class(id: str):
    try:
        oid = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Class not found")
        
    if (class_obj := await db.get_db()["classes"].find_one({"_id": oid})) is not None:
        return class_obj
    raise HTTPException(status_code=404, detail="Class not found")

@router.delete("/{id}", response_description="Delete a class")
async def delete_class(id: str):
    try:
        oid = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Class not found")

    delete_result = await db.get_db()["classes"].delete_one({"_id": oid})

    if delete_result.deleted_count == 1:
        return {"message": "Class deleted successfully"}

    raise HTTPException(status_code=404, detail="Class not found")

@router.put("/{id}", response_description="Update a class", response_model=ClassModel)
async def update_class(id: str, class_obj: ClassModel = Body(...)):
    try:
        oid = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Class not found")

    class_data = {k: v for k, v in class_obj.dict().items() if v is not None}

    if len(class_data) >= 1:
        # Prevent _id from being updated if it's in the body
        if "_id" in class_data:
            del class_data["_id"]
            
        update_result = await db.get_db()["classes"].update_one(
            {"_id": oid}, {"$set": class_data}
        )

        if update_result.modified_count == 1:
            updated_class = await db.get_db()["classes"].find_one({"_id": oid})
            if updated_class:
                return updated_class

    existing_class = await db.get_db()["classes"].find_one({"_id": oid})
    if existing_class:
        return existing_class

    raise HTTPException(status_code=404, detail="Class not found")
