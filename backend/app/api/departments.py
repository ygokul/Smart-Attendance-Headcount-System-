from fastapi import APIRouter, Body, HTTPException
from app.core.database import db
from app.models.department import Department
from fastapi.encoders import jsonable_encoder
from typing import List
from bson import ObjectId
from bson.errors import InvalidId

router = APIRouter()

@router.post("/", response_description="Add new department", response_model=Department)
async def create_department(dept: Department = Body(...)):
    dept = jsonable_encoder(dept)
    if "_id" in dept and dept["_id"] is None:
        del dept["_id"]
    new_dept = await db.get_db()["departments"].insert_one(dept)
    created_dept = await db.get_db()["departments"].find_one({"_id": new_dept.inserted_id})
    return created_dept

@router.get("/", response_description="List all departments", response_model=List[Department])
async def list_departments():
    departments = await db.get_db()["departments"].find().to_list(100)
    return departments

@router.delete("/{id}", response_description="Delete a department")
async def delete_department(id: str):
    try:
        oid = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Department not found")

    delete_result = await db.get_db()["departments"].delete_one({"_id": oid})

    if delete_result.deleted_count == 1:
         return {"message": "Department deleted successfully"}

    raise HTTPException(status_code=404, detail="Department not found")

@router.put("/{id}", response_description="Update a department", response_model=Department)
async def update_department(id: str, dept: Department = Body(...)):
    try:
        oid = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Department not found")

    dept_data = {k: v for k, v in dept.dict().items() if v is not None}

    if len(dept_data) >= 1:
        # Prevent _id from being updated if it's in the body
        if "_id" in dept_data:
            del dept_data["_id"]

        update_result = await db.get_db()["departments"].update_one(
            {"_id": oid}, {"$set": dept_data}
        )

        if update_result.modified_count == 1:
            updated_dept = await db.get_db()["departments"].find_one({"_id": oid})
            if updated_dept:
                return updated_dept

    existing_dept = await db.get_db()["departments"].find_one({"_id": oid})
    if existing_dept:
        return existing_dept

    raise HTTPException(status_code=404, detail="Department not found")
