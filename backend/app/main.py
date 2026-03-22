from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import db
from app.api import users, face, classes, attendance, reports, auth, departments, settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    db.connect()
    yield
    db.disconnect()

app = FastAPI(title="Face Attendance System API", version="1.0.0", lifespan=lifespan)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, tags=["Authentication"], prefix="/auth")
app.include_router(users.router, tags=["Users"], prefix="/users")
app.include_router(departments.router, tags=["Departments"], prefix="/departments")
app.include_router(face.router, tags=["Face"], prefix="/face")
app.include_router(classes.router, tags=["Classes"], prefix="/classes")
app.include_router(attendance.router, tags=["Attendance"], prefix="/attendance")
app.include_router(reports.router, tags=["Reports"], prefix="/reports")
app.include_router(settings.router, tags=["Settings"], prefix="/settings")

# Mount static files
app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

@app.get("/")
async def root():
    return FileResponse("static/index.html")

@app.get("/{path:path}")
async def serve_spa(path: str):
    return FileResponse("static/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
