/* ==========================================================================
   EduGester - Dashboard Controller (Teacher & Student Dashboards)
   ========================================================================== */

import { authService } from './authService.js';

export class DashboardController {
  constructor(classroomController, showToastCallback) {
    this.classroomController = classroomController;
    this.showToast = showToastCallback;

    const host = window.location.hostname || 'localhost';
    this.apiBase = `http://${host}:8080/api/classes`;
  }

  init() {
    // Teacher Create Class Form Submit
    document.getElementById('formCreateClassDashboard')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('dashClassTitle').value.trim();
      const subject = document.getElementById('dashClassSubject').value;
      const modelType = document.getElementById('dashModelType').value;

      const res = await this.createTeacherClass(title, subject, modelType);
      if (res.success) {
        this.closeModal('modalCreateClass');
        this.showToast(`✨ Created Class ${res.classData.classCode}!`);
        this.loadTeacherDashboard();
        // Automatically enter class as teacher
        this.classroomController.openClassroom(res.classData.className, res.classData.classCode, res.classData.modelType, 'teacher');
      } else {
        this.showToast(`⚠️ ${res.error}`);
      }
    });

    // Student Join Class Form Submit
    document.getElementById('formStudentJoinDashboard')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const codeInput = document.getElementById('dashJoinCode').value.trim().toUpperCase();
      const errorEl = document.getElementById('dashJoinError');

      if (errorEl) errorEl.classList.add('hidden');

      const validation = await this.validateClassCode(codeInput);
      if (validation.valid) {
        const { className, classCode, modelType } = validation.classData;
        this.showToast(`🎓 Joining Live Room ${classCode}...`);
        this.classroomController.openClassroom(className, classCode, modelType, 'student');
      } else {
        if (errorEl) {
          errorEl.textContent = validation.error || 'Invalid class code or class has ended.';
          errorEl.classList.remove('hidden');
        }
        this.showToast(`⚠️ ${validation.error || 'Invalid class code'}`);
      }
    });
  }

  async loadTeacherDashboard() {
    const container = document.getElementById('teacherClassesList');
    if (!container) return;

    container.innerHTML = `<div class="loading-spinner">Loading your created classes...</div>`;

    try {
      const res = await fetch(`${this.apiBase}/my-classes`, {
        headers: { Authorization: `Bearer ${authService.token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load teacher classes');
      }

      if (!data.classes || data.classes.length === 0) {
        container.innerHTML = `
          <div class="empty-dashboard-state">
            <span class="icon">📚</span>
            <h3>No Active Classes Created Yet</h3>
            <p>Click "Create New Class" to generate a room code and start teaching in 3D.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = data.classes.map(cls => `
        <div class="dash-class-card ${cls.status.toLowerCase()}">
          <div class="card-status-pill ${cls.status.toLowerCase()}">
            <span class="pulse-dot ${cls.status === 'LIVE' ? 'red' : 'gray'}"></span>
            ${cls.status}
          </div>
          <div class="card-body-content">
            <h4>${cls.className}</h4>
            <div class="card-meta-line">
              <span class="subject-badge">${cls.subject}</span>
              <span class="code-pill">Code: <strong>${cls.classCode}</strong></span>
              <span class="students-badge">👥 ${cls.studentsCount || 0} Students</span>
              ${cls.durationMin ? `<span class="duration-badge">⏱ ${cls.durationMin}m</span>` : ''}
            </div>
          </div>
          <div class="card-actions">
            ${cls.status === 'LIVE' ? `
              <button class="btn btn-primary btn-sm btn-enter-teacher-class" data-code="${cls.classCode}" data-title="${cls.className}" data-model="${cls.modelType}">
                Enter Live Class &rarr;
              </button>
            ` : `
              <span class="ended-text">Completed Session</span>
            `}
          </div>
        </div>
      `).join('');

      container.querySelectorAll('.btn-enter-teacher-class').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const code = e.currentTarget.dataset.code;
          const title = e.currentTarget.dataset.title;
          const model = e.currentTarget.dataset.model;
          this.classroomController.openClassroom(title, code, model, 'teacher');
        });
      });
    } catch (err) {
      container.innerHTML = `<div class="error-box">Failed to fetch classes: ${err.message}</div>`;
    }
  }

  async loadStudentDashboard() {
    const container = document.getElementById('studentClassHistoryList');
    if (!container) return;

    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:8080/api/student/history`, {
        headers: { Authorization: `Bearer ${authService.token}` },
      });
      const data = await res.json();

      if (!res.ok || !data.classes || data.classes.length === 0) {
        container.innerHTML = `<p class="muted-text">No enrolled class history found.</p>`;
        return;
      }

      container.innerHTML = data.classes.map(cls => `
        <div class="history-item-row">
          <div class="history-main">
            <strong>${cls.className}</strong>
            <span class="history-sub">${cls.subject} • Teacher: ${cls.teacherName}</span>
          </div>
          <div class="history-meta">
            <span class="code-pill">${cls.classCode}</span>
            <span class="card-status-pill ${cls.status.toLowerCase()}">${cls.status}</span>
          </div>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<p class="muted-text">Could not load student history.</p>`;
    }
  }

  async createTeacherClass(className, subject, modelType) {
    try {
      const res = await fetch(`${this.apiBase}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authService.token}`,
        },
        body: JSON.stringify({ className, subject, modelType }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create classroom.');
      }

      return { success: true, classData: data.classData };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async validateClassCode(code) {
    try {
      const res = await fetch(`${this.apiBase}/validate/${code}`);
      const data = await res.json();
      return data;
    } catch (err) {
      return { valid: false, error: 'Could not connect to backend server.' };
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }
}

