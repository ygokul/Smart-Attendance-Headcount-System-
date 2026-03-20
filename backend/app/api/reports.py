from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.core.database import db
from datetime import datetime

router = APIRouter()

@router.get("/dashboard-stats", response_description="Dashboard Statistics")
async def get_dashboard_stats():
    today = datetime.now().strftime("%Y-%m-%d")
    
    total_students = await db.get_db()["users"].count_documents({"role": "student"})
    total_faculty = await db.get_db()["users"].count_documents({"role": "faculty"})
    
    # Today's attendance unique count? Or total records?
    # Total distinct students present today
    distinct_present = await db.get_db()["attendance"].distinct("student_id", {"date": today, "status": "present"})
    present_count = len(distinct_present)
    
    return {
        "total_students": total_students,
        "total_faculty": total_faculty,
        "present_today": present_count,
        "attendance_rate": round((present_count / total_students * 100), 2) if total_students > 0 else 0
    }

@router.get("/attendance", response_description="Get attendance logs")
async def get_attendance_logs(
    date: Optional[str] = None,
    student_id: Optional[str] = None,
    class_name: Optional[str] = None,
    role: Optional[str] = None,
    subject: Optional[str] = None
):
    query = {}
    if date:
        query["date"] = date
    if student_id:
        query["student_id"] = student_id
    
    if class_name:
        students = await db.get_db()["users"].find({"class_section": class_name}).to_list(None)
        student_ids = [s["_id"] for s in students]
        query["student_id"] = {"$in": student_ids}
        
    if role:
        # Filter users by role first to get IDs
        role_users = await db.get_db()["users"].find({"role": role}).to_list(None)
        role_user_obj_ids = [u["_id"] for u in role_users]
        
        if "student_id" in query:
             # If we are already filtering by specific student(s), ensure they match the role
             pass 
        else:
             query["student_id"] = {"$in": role_user_obj_ids}

    if subject:
        query["subject"] = {"$regex": subject, "$options": "i"}

    # Fetch logs FIRST
    logs = await db.get_db()["attendance"].find(query).sort("timestamp", -1).to_list(100)

    # Populate student names
    student_ids = list(set([log["student_id"] for log in logs if log.get("student_id")]))
    users = await db.get_db()["users"].find({"_id": {"$in": student_ids}}).to_list(None)
    user_map = {str(u["_id"]): u for u in users}

    # Helper to convert ObjectId to str and add user info
    results = []
    for log in logs:
        log["_id"] = str(log["_id"])
        
        student_id_str = str(log.get("student_id"))
        if log.get("student_id"):
             log["student_id"] = student_id_str
             
        user = user_map.get(student_id_str, {})
        log["student_name"] = user.get("name", "Unknown")
        log["role"] = user.get("role", "Unknown")
        log["class_name"] = user.get("class_section", "N/A")
        
        # Format times
        if isinstance(log.get("timestamp"), datetime):
            log["check_in"] = log["timestamp"].strftime("%H:%M:%S")
        else:
            log["check_in"] = str(log.get("timestamp", ""))
            
        if log.get("out_time") and isinstance(log["out_time"], datetime):
             log["check_out"] = log["out_time"].strftime("%H:%M:%S")
        else:
             log["check_out"] = "-"
        
        results.append(log)
        
    return results

@router.get("/absent", response_description="Get absent students")
async def get_absent_report(
    date: str,
    period: str = "full_day", # morning, lunch, full_day
    class_name: Optional[str] = None
):
    # 1. Get All Students (filtered by class if needed)
    user_query = {"role": "student"}
    if class_name:
        user_query["class_section"] = class_name
        
    all_students = await db.get_db()["users"].find(user_query).to_list(None)
    
    # 2. Get Present Students for the given Date and Period
    attendance_query = {"date": date}
    
    if period == "morning":
        attendance_query["period"] = {"$in": ["Morning", "Daily"]}
    elif period == "lunch":
        attendance_query["period"] = "Lunch"
    # full_day means ANY record exists for that day (they are NOT absent for the whole day)
    
    present_records = await db.get_db()["attendance"].find(attendance_query).to_list(None)
    present_student_ids = set([str(r["student_id"]) for r in present_records if r.get("student_id")])
    
    # 3. Calculate Absent
    absent_list = []
    for student in all_students:
        if str(student["_id"]) not in present_student_ids:
            absent_list.append({
                "_id": str(student["_id"]),
                "name": student.get("name"),
                "class_section": student.get("class_section"),
                "role": "student",
                "status": "absent"
            })
            
    return absent_list

@router.get("/export", response_description="Export attendance to Excel")
async def export_attendance(date: str = Query(..., description="Date to export (YYYY-MM-DD)")):
    # 1. Fetch Logs
    logs = await db.get_db()["attendance"].find({"date": date}).to_list(None)
    
    if not logs:
        raise HTTPException(status_code=404, detail="No records found for this date")

    # 2. Fetch Users for Names
    student_ids = list(set([log["student_id"] for log in logs if log.get("student_id")]))
    users = await db.get_db()["users"].find({"_id": {"$in": student_ids}}).to_list(None)
    user_map = {str(u["_id"]): u for u in users}
    
    # 3. Prepare Data for DataFrame
    data = []
    for log in logs:
        student_id_str = str(log.get("student_id"))
        user = user_map.get(student_id_str, {})
        
        data.append({
            "Date": log.get("date"),
            "Name": user.get("name", "Unknown"),
            "Role": user.get("role", "Unknown"),
            "Class": user.get("class_section", "N/A"),
            "Session/Period": log.get("period", "Daily"),
            "Status": log.get("status"),
            "Time": log.get("timestamp").strftime("%H:%M:%S") if isinstance(log.get("timestamp"), datetime) else log.get("timestamp"),
            "Confidence": round(log.get("confidence", 0) * 100, 2)
        })
        
    # 4. Create Excel
    import pandas as pd
    from io import BytesIO
    from fastapi.responses import StreamingResponse
    
    df = pd.DataFrame(data)
    
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="Attendance")
        
    output.seek(0)
    
    headers = {
        'Content-Disposition': f'attachment; filename="attendance_{date}.xlsx"'
    }
    
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
