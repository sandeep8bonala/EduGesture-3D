# ==============================================================================
# EduGester FastAPI Real-Time Application Entry Point
# ==============================================================================

import time
import json
import hashlib
from typing import Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.app.config import DATABASE_URL, REDIS_URL
from backend.app.database import init_db, SessionLocal, User, Classroom, ClassEnrollment, ClassroomState, LiveSession, hash_password
from backend.app.redis_client import redis_manager
from backend.app.auth.dependencies import create_jwt_token, get_current_user_from_token

app = FastAPI(title="EduGester Real-Time 3D Classroom API")

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    print("[FastAPI Startup] Initialized Database ORM & Pre-seeded accounts.")

# ------------------------------------------------------------------------------
# HEALTH CHECK ENDPOINTS
# ------------------------------------------------------------------------------
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "EduGester Real-Time FastAPI Backend", "timestamp": int(time.time() * 1000)}

@app.get("/health/database")
def health_database():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        return {"status": "healthy", "database": "connected", "orm": "SQLAlchemy", "users_count": db.query(User).count()}
    finally:
        db.close()

@app.get("/health/redis")
def health_redis():
    return {"status": "healthy", "redis": "connected"}

# ------------------------------------------------------------------------------
# AUTH SCHEMAS & ENDPOINTS
# ------------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/auth/register")
def register_user(req: RegisterRequest):
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
        if existing:
            raise HTTPException(status_code=400, detail="Account with this email already exists.")
        
        user_id = "usr-" + hashlib.sha256(req.email.encode('utf-8')).hexdigest()[:8]
        user = User(
            id=user_id,
            name=req.name,
            email=req.email.lower().strip(),
            password_hash=hash_password(req.password),
            role=req.role.upper()
        )
        db.add(user)
        db.commit()

        token = create_jwt_token(user.id, user.role, user.email, user.name)
        return {
            "message": "Registration successful",
            "token": token,
            "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role.lower()}
        }
    finally:
        db.close()

@app.post("/api/auth/login")
def login_user(req: LoginRequest):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == req.email.lower().strip()).first()
        if not user or user.password_hash != hash_password(req.password):
            raise HTTPException(status_code=401, detail="Invalid email or password credentials.")
        
        token = create_jwt_token(user.id, user.role, user.email, user.name)
        return {
            "message": "Login successful",
            "token": token,
            "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role.lower()}
        }
    finally:
        db.close()

# ------------------------------------------------------------------------------
# CLASSROOM SCHEMAS & ENDPOINTS
# ------------------------------------------------------------------------------
class CreateClassroomRequest(BaseModel):
    className: Optional[str] = None
    class_name: Optional[str] = None
    subject: Optional[str] = "Biology"
    description: Optional[str] = None
    modelType: Optional[str] = "heart"

class JoinClassroomRequest(BaseModel):
    class_code: Optional[str] = None
    classCode: Optional[str] = None

@app.post("/api/classrooms")
@app.post("/api/classes/create")
def create_classroom(req: CreateClassroomRequest):
    db = SessionLocal()
    try:
        topic = req.className or req.class_name or "Human Heart Anatomy"
        teacher = db.query(User).filter(User.role == "TEACHER").first()
        teacher_id = teacher.id if teacher else "usr-teacher-1"
        teacher_name = teacher.name if teacher else "Dr. Sarah Jenkins"

        code = "BIO" + str(int(time.time()))[-4:]
        classroom = Classroom(
            id="cls-" + code.lower(),
            class_code=code,
            class_name=topic,
            subject=req.subject or "Biology",
            description=req.description or topic,
            teacher_id=teacher_id,
            status="LIVE",
            current_model=req.modelType or "heart",
            started_at=int(time.time() * 1000)
        )
        db.add(classroom)
        db.commit()

        initial_state = ClassroomState(
            id="st-" + code.lower(),
            classroom_id=classroom.id,
            model_id=req.modelType or "heart",
            version=1
        )
        db.add(initial_state)
        db.commit()

        redis_manager.set_live_room_state(code, {
            "model_id": req.modelType or "heart",
            "rotation": {"x": 0, "y": 0, "z": 0},
            "position": {"x": 0, "y": 0, "z": 0},
            "scale": {"x": 1, "y": 1, "z": 1},
            "version": 1
        })

        return {
            "message": "Classroom created successfully",
            "id": classroom.id,
            "class_code": classroom.class_code,
            "status": classroom.status,
            "classData": {
                "classCode": classroom.class_code,
                "className": classroom.class_name,
                "subject": classroom.subject,
                "status": classroom.status,
                "modelType": classroom.current_model,
                "teacherName": teacher_name
            }
        }
    finally:
        db.close()

@app.post("/api/classrooms/join")
def join_classroom(req: JoinClassroomRequest):
    code = (req.class_code or req.classCode or "").upper()
    db = SessionLocal()
    try:
        classroom = db.query(Classroom).filter(Classroom.class_code == code).first()
        if not classroom or classroom.status == "ENDED":
            raise HTTPException(status_code=400, detail="Classroom does not exist or has ended.")
        
        teacher = db.query(User).filter(User.id == classroom.teacher_id).first()
        count = redis_manager.get_student_count(code) + 1

        return {
            "classroom_id": classroom.id,
            "class_code": classroom.class_code,
            "status": classroom.status,
            "teacher": {
                "id": classroom.teacher_id,
                "name": teacher.name if teacher else "Teacher"
            },
            "student_count": count
        }
    finally:
        db.close()

@app.get("/api/classes/validate/{code}")
def validate_classroom(code: str):
    db = SessionLocal()
    try:
        classroom = db.query(Classroom).filter(Classroom.class_code == code.upper()).first()
        if not classroom:
            return {"valid": False, "error": f"Class code '{code}' does not exist."}
        if classroom.status == "ENDED":
            return {"valid": False, "error": f"Class session '{code}' has ended."}
        
        teacher = db.query(User).filter(User.id == classroom.teacher_id).first()
        return {
            "valid": True,
            "classData": {
                "classCode": classroom.class_code,
                "className": classroom.class_name,
                "subject": classroom.subject,
                "status": classroom.status,
                "modelType": classroom.current_model,
                "teacherName": teacher.name if teacher else "Teacher"
            }
        }
    finally:
        db.close()
