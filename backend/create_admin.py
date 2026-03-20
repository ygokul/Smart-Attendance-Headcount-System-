import asyncio
from app.core.database import db
from app.services.auth_service import auth_service
from app.models.user import UserCreate
from fastapi.encoders import jsonable_encoder

async def create_admin():
    db.connect()
    print("Database connected.")
    
    users_collection = db.get_db()["users"]
    
    # Check if admin exists
    existing_admin = await users_collection.find_one({"role": "admin", "name": "admin"})
    
    admin_data = {
        "name": "admin",
        "email": "admin@gmail.com",
        "role": "admin",
        "hashed_password": auth_service.get_password_hash("admin123"),
        "created_at": "2024-01-01T00:00:00"
    }
    
    if existing_admin:
        print("Admin user 'admin' already exists. Updating password to 'admin123'.")
        await users_collection.update_one(
            {"_id": existing_admin["_id"]},
            {"$set": {"hashed_password": admin_data["hashed_password"]}}
        )
    else:
        print("Creating new admin user 'admin'.")
        await users_collection.insert_one(admin_data)
        
    print("Admin user ready. Username: 'admin', Password: 'admin123'")
    db.disconnect()

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(create_admin())
