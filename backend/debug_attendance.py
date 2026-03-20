import asyncio
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

async def debug_attendance():
    from motor.motor_asyncio import AsyncIOMotorClient
    
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    database_name = os.getenv("DATABASE_NAME", "face_attendance_db")
    
    client = AsyncIOMotorClient(mongo_url)
    database = client[database_name]
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    with open("debug_output.txt", "w") as f:
        f.write(f"DEBUGGING DATE: {today}\n")
        
        # 1. PENDING
        count_pending = await database["pending_attendance"].count_documents({})
        f.write(f"Total Pending: {count_pending}\n")
        pending = await database["pending_attendance"].find().sort("timestamp", -1).to_list(5)
        for p in pending:
            f.write(f"PENDING: User={p.get('user_name')} Date={p.get('date')} Time={p.get('timestamp')}\n")
            
        # 2. APPROVED
        count_approved = await database["attendance"].count_documents({})
        f.write(f"Total Approved: {count_approved}\n")
        approved = await database["attendance"].find().sort("timestamp", -1).to_list(10)
        for a in approved:
            f.write(f"APPROVED: StudentID={a.get('student_id')} Date={a.get('date')} Status={a.get('status')}\n")

        # 3. Check for today specifically
        todays_approved = await database["attendance"].count_documents({"date": today})
        f.write(f"Approved (Today {today}): {todays_approved}\n")

if __name__ == "__main__":
    asyncio.run(debug_attendance())
