from fastapi import APIRouter, HTTPException, Depends, status, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.services.auth_service import auth_service
from app.core.database import db
from app.models.user import UserInDB, UserCreate
from jose import JWTError, jwt
from app.core.config import settings
from bson import ObjectId

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.post("/login", response_description="Login for Token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Verify credentials against DB
    user = await db.get_db()["users"].find_one({"email": form_data.username})
    if not user:
        user = await db.get_db()["users"].find_one({"name": form_data.username, "role": "admin"})

    if not user or not user.get("hashed_password") or not auth_service.verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    # Return a static session token instead of JWT
    return {"access_token": "admin_static_session_token", "token_type": "bearer", "role": user["role"]}

@router.get("/me", response_model=UserInDB)
async def read_users_me(token: str = Depends(oauth2_scheme)):
    # BYPASS JWT: Always return the admin user if a token is present
    user = await db.get_db()["users"].find_one({"role": "admin"})
    if not user:
        # Fallback if DB is empty
        raise HTTPException(status_code=401, detail="No admin user found in database")
    return user

# Helper to inject current user into other routes
async def get_current_user(token: str = Depends(oauth2_scheme)):
    return await read_users_me(token)
    
async def get_current_admin(current_user: UserInDB = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user
