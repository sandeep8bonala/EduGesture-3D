/* ==========================================================================
   EduGester - Persistent ORM Database Module (PostgreSQL / SQLite Storage Engine)
   ========================================================================== */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_FILE_PATH = path.resolve(process.cwd(), 'edugester_database.json');

// Helper: Password Hashing using SHA-256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_edugester_salt').digest('hex');
}

class PersistentDatabase {
  constructor() {
    this.data = {
      users: [],
      classrooms: [],
      enrollments: [],
      classroom_states: [],
      teacher_live_sessions: [],
    };

    this.init();
  }

  init() {
    this.loadFromFile();
    this.seedDefaultData();
  }

  loadFromFile() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
        this.data = JSON.parse(raw);
        console.log('[DATABASE] Loaded persistent database from edugester_database.json');
      }
    } catch (err) {
      console.error('[DATABASE] Error reading persistent database file:', err);
    }
  }

  saveToFile() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('[DATABASE] Error saving persistent database:', err);
    }
  }

  seedDefaultData() {
    // 1. Seed Teacher Account
    if (!this.findUserByEmail('dr.jenkins@harvard.edu')) {
      this.createUser({
        id: 'usr-teacher-1',
        name: 'Dr. Sarah Jenkins',
        email: 'dr.jenkins@harvard.edu',
        password: 'password123',
        role: 'TEACHER',
      });
    }

    // 2. Seed Student Account
    if (!this.findUserByEmail('alex.rivera@student.edu')) {
      this.createUser({
        id: 'usr-student-1',
        name: 'Alex Rivera',
        email: 'alex.rivera@student.edu',
        password: 'password123',
        role: 'STUDENT',
      });
    }

    // 3. Seed Default Active Classroom
    if (!this.findClassroomByCode('BIO7X2')) {
      const teacher = this.findUserByEmail('dr.jenkins@harvard.edu');
      const cls = this.createClassroom({
        classCode: 'BIO7X2',
        className: 'Human Heart Anatomy',
        subject: 'Biology',
        description: '3D Human Heart Anatomy & Circulation Lesson',
        teacherId: teacher.id,
        teacherName: teacher.name,
        modelType: 'heart',
        status: 'LIVE',
      });

      this.updateClassroomState('BIO7X2', {
        model_id: 'heart',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        animation_state: 'playing',
        highlighted_part: null,
      });
    }
  }

  /* ------------------------------------------------------------------------
     USER MODEL OPERATIONS
     ------------------------------------------------------------------------ */
  createUser({ id, name, email, password, role }) {
    const user = {
      id: id || 'usr-' + Math.random().toString(36).substring(2, 9),
      name: name || email.split('@')[0],
      email: email.toLowerCase().trim(),
      password_hash: hashPassword(password),
      role: (role || 'STUDENT').toUpperCase(),
      is_active: true,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    this.data.users.push(user);
    this.saveToFile();
    return user;
  }

  findUserByEmail(email) {
    if (!email) return null;
    return this.data.users.find((u) => u.email === email.toLowerCase().trim()) || null;
  }

  findUserById(id) {
    return this.data.users.find((u) => u.id === id) || null;
  }

  verifyUserCredentials(email, password) {
    const user = this.findUserByEmail(email);
    if (!user) return null;
    const hash = hashPassword(password);
    if (user.password_hash === hash) {
      return user;
    }
    return null;
  }

  /* ------------------------------------------------------------------------
     CLASSROOM MODEL OPERATIONS
     ------------------------------------------------------------------------ */
  createClassroom({ classCode, className, subject, description, teacherId, teacherName, modelType, status }) {
    const now = Date.now();
    const classroom = {
      id: 'cls-' + Math.random().toString(36).substring(2, 9),
      class_code: (classCode || 'EDU' + Math.floor(100 + Math.random() * 900)).toUpperCase(),
      class_name: className || '3D Interactive Classroom',
      subject: subject || 'Biology',
      description: description || 'Interactive 3D Lesson Session',
      teacher_id: teacherId,
      teacher_name: teacherName || 'Educator',
      status: status || 'LIVE',
      current_model: modelType || 'heart',
      current_lesson: className || 'Interactive 3D Lesson',
      created_at: now,
      started_at: status === 'LIVE' ? now : null,
      ended_at: null,
    };

    this.data.classrooms.push(classroom);
    this.saveToFile();
    return classroom;
  }

  findClassroomByCode(classCode) {
    if (!classCode) return null;
    return this.data.classrooms.find((c) => c.class_code === classCode.toUpperCase()) || null;
  }

  startClassroom(classCode) {
    const cls = this.findClassroomByCode(classCode);
    if (cls) {
      cls.status = 'LIVE';
      if (!cls.started_at) cls.started_at = Date.now();
      this.saveToFile();
    }
    return cls;
  }

  endClassroom(classCode) {
    const cls = this.findClassroomByCode(classCode);
    if (cls) {
      cls.status = 'ENDED';
      cls.ended_at = Date.now();

      // Close open enrollments
      this.data.enrollments.forEach((e) => {
        if (e.classroom_id === cls.id && e.status === 'ACTIVE') {
          e.status = 'LEFT';
          e.left_at = Date.now();
        }
      });

      this.saveToFile();
    }
    return cls;
  }

  getTeacherClasses(teacherId) {
    return this.data.classrooms
      .filter((c) => c.teacher_id === teacherId)
      .map((c) => {
        const enrollments = this.data.enrollments.filter((e) => e.classroom_id === c.id);
        const durationMin = c.ended_at && c.started_at
          ? Math.max(1, Math.round((c.ended_at - c.started_at) / 60000))
          : c.started_at ? Math.max(1, Math.round((Date.now() - c.started_at) / 60000)) : 0;

        return {
          id: c.id,
          classCode: c.class_code,
          className: c.class_name,
          subject: c.subject,
          status: c.status,
          modelType: c.current_model,
          studentsCount: enrollments.length,
          startedAt: c.started_at,
          endedAt: c.ended_at,
          durationMin,
        };
      })
      .sort((a, b) => b.startedAt - a.startedAt);
  }

  getStudentClasses(studentId) {
    const studentEnrollments = this.data.enrollments.filter((e) => e.student_id === studentId);
    const classIds = new Set(studentEnrollments.map((e) => e.classroom_id));

    return this.data.classrooms
      .filter((c) => classIds.has(c.id))
      .map((c) => {
        const teacher = this.findUserById(c.teacher_id);
        const enrollment = studentEnrollments.find((e) => e.classroom_id === c.id);
        return {
          id: c.id,
          classCode: c.class_code,
          className: c.class_name,
          subject: c.subject,
          status: c.status,
          teacherName: teacher ? teacher.name : c.teacher_name,
          joinedAt: enrollment ? enrollment.joined_at : c.created_at,
        };
      })
      .sort((a, b) => b.joinedAt - a.joinedAt);
  }

  /* ------------------------------------------------------------------------
     CLASS ENROLLMENT OPERATIONS
     ------------------------------------------------------------------------ */
  enrollStudent(classCode, studentId) {
    const cls = this.findClassroomByCode(classCode);
    if (!cls) return null;

    let enrollment = this.data.enrollments.find(
      (e) => e.classroom_id === cls.id && e.student_id === studentId
    );

    if (!enrollment) {
      enrollment = {
        id: 'enr-' + Math.random().toString(36).substring(2, 9),
        classroom_id: cls.id,
        student_id: studentId,
        joined_at: Date.now(),
        left_at: null,
        status: 'ACTIVE',
      };
      this.data.enrollments.push(enrollment);
    } else {
      enrollment.status = 'ACTIVE';
      enrollment.joined_at = Date.now();
    }

    this.saveToFile();
    return enrollment;
  }

  /* ------------------------------------------------------------------------
     CLASSROOM STATE PERSISTENCE & VERSIONING
     ------------------------------------------------------------------------ */
  updateClassroomState(classCode, stateObj) {
    const cls = this.findClassroomByCode(classCode);
    if (!cls) return null;

    let stateRecord = this.data.classroom_states.find((s) => s.classroom_id === cls.id);
    const now = Date.now();

    if (!stateRecord) {
      stateRecord = {
        id: 'st-' + Math.random().toString(36).substring(2, 9),
        classroom_id: cls.id,
        model_id: stateObj.model_id || cls.current_model || 'heart',
        position: stateObj.position || { x: 0, y: 0, z: 0 },
        rotation: stateObj.rotation || { x: 0, y: 0, z: 0 },
        scale: stateObj.scale || { x: 1, y: 1, z: 1 },
        animation_state: stateObj.animation_state || 'playing',
        highlighted_part: stateObj.highlighted_part || null,
        lesson_state: stateObj.lesson_state || cls.current_lesson,
        version: 1,
        updated_at: now,
      };
      this.data.classroom_states.push(stateRecord);
    } else {
      stateRecord.model_id = stateObj.model_id || stateRecord.model_id;
      stateRecord.position = stateObj.position || stateRecord.position;
      stateRecord.rotation = stateObj.rotation || stateRecord.rotation;
      stateRecord.scale = stateObj.scale || stateRecord.scale;
      stateRecord.animation_state = stateObj.animation_state || stateRecord.animation_state;
      stateRecord.highlighted_part = stateObj.highlighted_part !== undefined ? stateObj.highlighted_part : stateRecord.highlighted_part;
      stateRecord.version += 1;
      stateRecord.updated_at = now;
    }

    this.saveToFile();
    return stateRecord;
  }

  getLatestClassroomState(classCode) {
    const cls = this.findClassroomByCode(classCode);
    if (!cls) return null;
    return this.data.classroom_states.find((s) => s.classroom_id === cls.id) || null;
  }
}

export const db = new PersistentDatabase();
