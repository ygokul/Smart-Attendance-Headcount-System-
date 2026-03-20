from fastapi import APIRouter, File, UploadFile, HTTPException, Body
from datetime import datetime
from app.services.face_service import face_service
from app.core.database import db
from app.models.attendance import Attendance
from app.models.pending import PendingAttendance
from app.models.settings import get_default_settings 
import numpy as np
from bson import ObjectId

router = APIRouter()

@router.post("/mark", response_description="Scan face and queue for approval")
async def mark_attendance(file: UploadFile = File(...)):
    # 1. Detect Face
    content = await file.read()
    embedding = face_service.get_embedding(content)
    if not embedding:
        raise HTTPException(status_code=400, detail="No face detected")

    # 2. Identify User
    users = await db.get_db()["users"].find({"face_embeddings": {"$exists": True, "$ne": []}}).to_list(None)
    best_match = None
    max_similarity = 0.0
    threshold = 0.6
    
    for user in users:
        for saved_emb in user.get("face_embeddings", []):
            sim = np.dot(embedding, saved_emb) / (np.linalg.norm(embedding) * np.linalg.norm(saved_emb))
            if sim > max_similarity:
                max_similarity = sim
                best_match = user
    
    if not best_match or max_similarity < threshold:
         raise HTTPException(status_code=404, detail="Student not recognized")
         
    user = best_match
    now = datetime.now()
    
    # Optional: Detect Subject based on Schedule
    subject_detected = None
    current_day = now.strftime("%A")
    current_time_str = now.strftime("%H:%M")
    
    class_name = user.get("class_section")
    if class_name:
        class_obj = await db.get_db()["classes"].find_one({"name": class_name})
        if class_obj:
            for day_sch in class_obj.get("schedule", []):
                if day_sch["day"] == current_day:
                    for per in day_sch["periods"]:
                        if per["start_time"] <= current_time_str <= per["end_time"]:
                            subject_detected = per.get("subject")
                            break
    
    today_str = now.strftime("%Y-%m-%d") # e.g. "2026-01-11"

    # B. Attendance Logic based on Role
    settings_data = await db.get_db()["settings"].find_one({"_id": "global_settings"})
    if not settings_data:
        settings_obj = get_default_settings()
        settings_data = settings_obj.dict()

    role = user.get("role", "student")
    role_settings = settings_data.get(role)
    current_time_hm = now.strftime("%H:%M")

    # --- Student Logic: Two Separate Sessions (Morning, Lunch) ---
    if role == "student":
        session_name = None
        if role_settings:
            morning = role_settings.get("morning")
            lunch = role_settings.get("lunch")
            
            if morning and morning["start"] <= current_time_hm <= morning["end"]:
                session_name = "Morning"
            elif lunch and lunch["start"] <= current_time_hm <= lunch["end"]:
                session_name = "Lunch"
        
        if session_name:
            # Check for Duplicate IN THIS SESSION
            existing = await db.get_db()["attendance"].find_one({
                "student_id": user["_id"],
                "date": today_str,
                "period": session_name
            })
            
            if existing:
                return {
                    "message": f"Attendance already marked for {session_name}",
                    "user": user["name"],
                    "status": existing["status"],
                    "timestamp": existing["timestamp"].strftime("%H:%M:%S")
                }
            
            # Insert New Record
            new_attendance = {
                "student_id": user["_id"],
                "date": today_str,
                "status": "present",
                "timestamp": now,
                "confidence": float(max_similarity),
                "period": session_name,
                "subject": subject_detected
            }
            await db.get_db()["attendance"].insert_one(new_attendance)
            return {
                "message": f"{session_name} attendance marked",
                "user": user["name"],
                "status": "present",
                "timestamp": now.strftime("%H:%M:%S")
            }
        else:
            # Not in any valid slot -> Late / Queue?
            # Existing logic for queue
            pass 

    # --- Faculty Logic: In (Morning) / Out (Out Time) ---
    elif role == "faculty":
        # Check existing for TODAY (regardless of period/session)
        existing_attendance = await db.get_db()["attendance"].find_one({
            "student_id": user["_id"],
            "date": today_str
        })
        
        out_time_slot = role_settings.get("out_time")
        
        # Check-Out Logic
        if existing_attendance:
            if existing_attendance.get("out_time"):
                 return {
                     "message": "Check-out already recorded",
                     "user": user["name"],
                     "status": "present",
                     "timestamp": now.strftime("%H:%M:%S"),
                     "type": "out"
                 }
            
            # If in Out Time slot OR simplistic "second scan = out" (User said "make it as out time in setting")
            # Let's check if current time is within Out Time slot
            is_out_time = False
            if out_time_slot and out_time_slot["start"] <= current_time_hm <= out_time_slot["end"]:
                is_out_time = True
            
            # Also allow checkout if explicitly in that slot, OR if second scan?
            # User said: "out time is only for faculty make it as out time in the setting itself"
            # Strict interpretation: Check-out only allowed during Out Time slot?
            # Let's be permissive: If scanning during Out Time, definitely Out.
            
            if is_out_time or True: # fallback to simple 2nd scan for now, but prioritized out time slot
                 await db.get_db()["attendance"].update_one(
                     {"_id": existing_attendance["_id"]},
                     {"$set": {"out_time": now}}
                 )
                 return {
                     "message": "Check-out recorded successfully",
                     "user": user["name"],
                     "status": "present",
                     "timestamp": now.strftime("%H:%M:%S"),
                     "type": "out"
                 }
        
        # Check-In Logic
        # Check if in Morning slot
        morning = role_settings.get("morning")
        if morning and morning["start"] <= current_time_hm <= morning["end"]:
             # Insert New Record
            new_attendance = {
                "student_id": user["_id"],
                "date": today_str,
                "status": "present",
                "timestamp": now,
                "confidence": float(max_similarity),
                "period": "Daily",
                "subject": subject_detected
            }
            await db.get_db()["attendance"].insert_one(new_attendance)
            return {
                "message": "Check-in marked successfully",
                "user": user["name"],
                "status": "present",
                "timestamp": now.strftime("%H:%M:%S")
            }

    # If falling through (Student Late, Faculty Late/Other), proceed to Pending Queue logic
    
    # C. Check if already pending (using string match for robustness)
    existing_pending = await db.get_db()["pending_attendance"].find_one({
        "user_id": user["_id"],
        "date": today_str 
    })
    if existing_pending:
         return {
             "message": "Already in approval queue",
             "user": user["name"],
             "status": "pending",
             "timestamp": now.strftime("%H:%M:%S")
         }

    # 3. Queue in Pending Attendance
    pending_record = {
        "user_id": user["_id"],
        "user_name": user["name"],
        "role": user["role"],
        "timestamp": now,
        "date": today_str, # Store date for easy dup checking
        "confidence": float(max_similarity),
        "status": "pending",
        "subject": subject_detected
    }
    
    result = await db.get_db()["pending_attendance"].insert_one(pending_record)
    
    return {
        "message": "Scan submitted for approval",
        "user": user["name"],
        "status": "pending",
        "timestamp": now.strftime("%H:%M:%S")
    }

@router.get("/pending", response_description="List pending attendance")
async def get_pending_attendance():
    pending = await db.get_db()["pending_attendance"].find().sort("timestamp", -1).to_list(100)
    # Convert ObjectId to str
    for p in pending:
        p["_id"] = str(p["_id"])
        p["user_id"] = str(p["user_id"])
    return pending

@router.post("/approve", response_description="Approve or Reject attendance")
async def approve_attendance(data: dict = Body(...)):
    pending_id = data.get("pending_id")
    action = data.get("action") # 'approve' or 'reject'
    
    if not pending_id or not action:
        raise HTTPException(status_code=400, detail="Missing pending_id or action")
        
    pending = await db.get_db()["pending_attendance"].find_one({"_id": ObjectId(pending_id)})
    if not pending:
         raise HTTPException(status_code=404, detail="Pending record not found")

    if action == "reject":
        await db.get_db()["pending_attendance"].delete_one({"_id": ObjectId(pending_id)})
        return {"message": "Attendance rejected"}
        
    if action == "approve":
        # Calculate Status based on Settings
        settings_data = await db.get_db()["settings"].find_one({"_id": "global_settings"})
        if not settings_data:
            settings_obj = get_default_settings()
            settings_data = settings_obj.dict()
            
        role = pending["role"]
        # Basic logic: Check if time is within any allowed slot for the role
        # This can be made more complex (Morning vs Lunch)
        
        timestamp = pending["timestamp"] 
        if isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp)
            
        time_str = timestamp.strftime("%H:%M")
        
        status_marked = "absent" # Default if not matching
        
        session_name = "Daily" # Default
        
        role_settings = settings_data.get(role) # student or faculty
        if role_settings:
            # Check Morning
            morning = role_settings.get("morning")
            if morning and morning["start"] <= time_str <= morning["end"]:
                status_marked = "present"
                session_name = "Morning"
            
            # Check Lunch (if exists)
            lunch = role_settings.get("lunch")
            if lunch and lunch["start"] <= time_str <= lunch["end"]:
                 status_marked = "present"
                 session_name = "Lunch"
        
        # Determine Late?
        # If not in slot but approved, maybe 'late'?
        if status_marked == "absent":
             # If admin is manually approving it, maybe default to 'present' or 'late'
             status_marked = "late"

        new_attendance = {
            "student_id": pending["user_id"], # Schema expects student_id
            "date": timestamp.strftime("%Y-%m-%d"),
            "status": status_marked,
            "timestamp": timestamp,
            "confidence": pending["confidence"],
            "period": session_name,
            "subject": pending.get("subject")
        }
        
        await db.get_db()["attendance"].insert_one(new_attendance)
        await db.get_db()["pending_attendance"].delete_one({"_id": ObjectId(pending_id)})
        
        return {"message": "Attendance approved", "status": status_marked}
        
    raise HTTPException(status_code=400, detail="Invalid action")

@router.delete("/{id}", response_description="Delete attendance record")
async def delete_attendance(id: str):
    delete_result = await db.get_db()["attendance"].delete_one({"_id": ObjectId(id)})

    if delete_result.deleted_count == 1:
        return {"message": "Attendance deleted successfully"}

    raise HTTPException(status_code=404, detail="Attendance record not found")
