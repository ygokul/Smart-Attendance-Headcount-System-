
import asyncio
from app.core.database import db
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def check_users():
    # Direct connection to be sure
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.DATABASE_NAME]
    
    users = await database["users"].find().to_list(100)
    print(f"Total users found: {len(users)}")
    for u in users:
        print(f"User: {u.get('name')}, Email: {u.get('email')}, Role: {u.get('role')}, Has Password: {bool(u.get('hashed_password'))}")

if __name__ == "__main__":
    asyncio.run(check_users())
