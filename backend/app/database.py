# ==============================================================================
# EduGester SQLAlchemy ORM Database & Model Definitions
# ==============================================================================

import os
import time
import json
import hashlib
from sqlalchemy import create_engine, Column, String, Integer, Boolean, BigInteger, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./edugester.db')

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def hash_password(password: str) -> str:
    return hashlib.sha256((password + "_edugester_salt").encode('utf-8')).hexdigest()

# ------------------------------------------------------------------------------
# 1. USER MODEL
# ------------------------------------------------------------------------------
class User(Base):
    __tablename__ = 'users'

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default='STUDENT') # TEACHER or STUDENT
    is_active = Column(Boolean, default=True)
    created_at = Column(BigInteger, default=lambda: int(time.time() * 1000))
    updated_at = Column(BigInteger, default=lambda: int(time.time() * 1000))

    classrooms = relationship("Classroom", back_populates="teacher")
    enrollments = relationship("ClassEnrollment", back_populates="student")

# ------------------------------------------------------------------------------
# 2. CLASSROOM MODEL
# ------------------------------------------------------------------------------
class Classroom(Base):
    __tablename__ = 'classrooms'

    id = Column(String, primary_key=True)
    class_code = Column(String, unique=True, index=True, nullable=False)
    class_name = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    teacher_id = Column(String, ForeignKey('users.id'), nullable=False)
    status = Column(String, default='WAITING') # WAITING, LIVE, ENDED
    current_model = Column(String, default='heart')
    current_lesson = Column(String, default='Human Heart Anatomy')
    created_at = Column(BigInteger, default=lambda: int(time.time() * 1000))
    started_at = Column(BigInteger, nullable=True)
    ended_at = Column(BigInteger, nullable=True)

    teacher = relationship("User", back_populates="classrooms")
    enrollments = relationship("ClassEnrollment", back_populates="classroom")
    states = relationship("ClassroomState", back_populates="classroom")
    sessions = relationship("LiveSession", back_populates="classroom")

# ------------------------------------------------------------------------------
# 3. CLASS ENROLLMENT MODEL
# ------------------------------------------------------------------------------
class ClassEnrollment(Base):
    __tablename__ = 'class_enrollments'

    id = Column(String, primary_key=True)
    classroom_id = Column(String, ForeignKey('classrooms.id'), nullable=False)
    student_id = Column(String, ForeignKey('users.id'), nullable=False)
    joined_at = Column(BigInteger, default=lambda: int(time.time() * 1000))
    left_at = Column(BigInteger, nullable=True)
    status = Column(String, default='ACTIVE') # ACTIVE, LEFT

    classroom = relationship("Classroom", back_populates="enrollments")
    student = relationship("User", back_populates="enrollments")

# ------------------------------------------------------------------------------
# 4. CLASSROOM STATE MODEL (WITH VERSION SEQUENCE NUMBER)
# ------------------------------------------------------------------------------
class ClassroomState(Base):
    __tablename__ = 'classroom_states'

    id = Column(String, primary_key=True)
    classroom_id = Column(String, ForeignKey('classrooms.id'), nullable=False)
    model_id = Column(String, default='heart')
    position_json = Column(Text, default='{"x":0,"y":0,"z":0}')
    rotation_json = Column(Text, default='{"x":0,"y":0,"z":0}')
    scale_json = Column(Text, default='{"x":1,"y":1,"z":1}')
    animation_state = Column(String, default='playing')
    highlighted_part = Column(String, nullable=True)
    lesson_state = Column(String, nullable=True)
    version = Column(Integer, default=1)
    updated_at = Column(BigInteger, default=lambda: int(time.time() * 1000))

    classroom = relationship("Classroom", back_populates="states")

# ------------------------------------------------------------------------------
# 5. LIVE SESSION MODEL
# ------------------------------------------------------------------------------
class LiveSession(Base):
    __tablename__ = 'live_sessions'

    id = Column(String, primary_key=True)
    classroom_id = Column(String, ForeignKey('classrooms.id'), nullable=False)
    teacher_id = Column(String, ForeignKey('users.id'), nullable=False)
    video_enabled = Column(Boolean, default=True)
    audio_enabled = Column(Boolean, default=True)
    started_at = Column(BigInteger, default=lambda: int(time.time() * 1000))
    ended_at = Column(BigInteger, nullable=True)

    classroom = relationship("Classroom", back_populates="sessions")

# Auto-Create Tables & Seed Default Data
def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed Teacher
        teacher = db.query(User).filter(User.email == "dr.jenkins@harvard.edu").first()
        if not teacher:
            teacher = User(
                id="usr-teacher-1",
                name="Dr. Sarah Jenkins",
                email="dr.jenkins@harvard.edu",
                password_hash=hash_password("password123"),
                role="TEACHER"
            )
            db.add(teacher)
            db.commit()

        # Seed Student
        student = db.query(User).filter(User.email == "alex.rivera@student.edu").first()
        if not student:
            student = User(
                id="usr-student-1",
                name="Alex Rivera",
                email="alex.rivera@student.edu",
                password_hash=hash_password("password123"),
                role="STUDENT"
            )
            db.add(student)
            db.commit()

        # Seed Classroom BIO7X2
        classroom = db.query(Classroom).filter(Classroom.class_code == "BIO7X2").first()
        if not classroom:
            classroom = Classroom(
                id="cls-101",
                class_code="BIO7X2",
                class_name="Human Heart Anatomy",
                subject="Biology",
                description="3D Human Heart Anatomy & Circulation Lesson",
                teacher_id=teacher.id,
                status="LIVE",
                current_model="heart",
                current_lesson="Human Heart Anatomy",
                started_at=int(time.time() * 1000)
            )
            db.add(classroom)
            db.commit()

            c_state = ClassroomState(
                id="st-101",
                classroom_id=classroom.id,
                model_id="heart",
                position_json=json.dumps({"x":0,"y":0,"z":0}),
                rotation_json=json.dumps({"x":0,"y":0,"z":0}),
                scale_json=json.dumps({"x":1,"y":1,"z":1}),
                animation_state="playing",
                version=1
            )
            db.add(c_state)
            db.commit()
    except Exception as e:
        print("[DB Init Error]", e)
    finally:
        db.close()
