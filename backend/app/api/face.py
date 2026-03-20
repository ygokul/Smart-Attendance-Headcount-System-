from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from typing import List
from app.services.face_service import face_service
from app.core.database import db
from bson import ObjectId
import numpy as np

router = APIRouter()

@router.post("/register/{user_id}", response_description="Register face for user")
async def register_face(user_id: str, file: UploadFile = File(...)):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid User ID")
    
    user = await db.get_db()["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    content = await file.read()
    embedding = face_service.get_embedding(content)
    
    if not embedding:
        raise HTTPException(status_code=400, detail="No face detected in the image")
    
    # Store embedding
    await db.get_db()["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"face_embeddings": embedding}}
    )
    
    return {"message": "Face registered successfully"}

@router.post("/recognize", response_description="Recognize face")
async def recognize_face(file: UploadFile = File(...)):
    content = await file.read()
    embedding = face_service.get_embedding(content)
    
    if not embedding:
        raise HTTPException(status_code=400, detail="No face detected")
    
    # Fetch all users with embeddings
    users = await db.get_db()["users"].find({"face_embeddings": {"$exists": True, "$ne": []}}).to_list(None)
    
    best_match = None
    max_similarity = 0.0
    threshold = 0.6 
    
    matches = []

    for user in users:
        for saved_emb in user.get("face_embeddings", []):
            sim = np.dot(embedding, saved_emb) / (np.linalg.norm(embedding) * np.linalg.norm(saved_emb))
            if sim > max_similarity:
                max_similarity = sim
                best_match = user
    
    if best_match and max_similarity > threshold:
        return {
            "user_id": str(best_match["_id"]),
            "name": best_match["name"],
            "role": best_match["role"],
            "confidence": float(max_similarity)
        }
    
    raise HTTPException(status_code=404, detail="Face not recognized")
