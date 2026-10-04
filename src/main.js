import { ThreeEngine } from './threeEngine.js';
import { GestureEngine } from './gestureEngine.js';
import { ClassroomController } from './classroom.js';
import { renderClassesGrid, CURRICULUM_DATA } from './classesCatalog.js';
import { wsService } from './websocketService.js';
import { authService } from './authService.js';
import { DashboardController } from './dashboardController.js';

class EduGesterApp {
  constructor() {
    this.threeEngine = new ThreeEngine();
    this.classroomController = null;
    this.dashboardController = null;
    this.gestureEngine = null;

    // Current User Session State
    this.currentUser = null;
  }

  init() {
    // 1. Toast Notification Helper
    window.showToast = (msg) => this.showToast(msg);

    // 2. Connect WebSocket Client
    wsService.connect();

    // 3. Setup Gesture Engine, Classroom Controller & Dashboard Controller
    this.gestureEngine = new GestureEngine(this.threeEngine, (gestureInfo) => {
      if (this.classroomController) {
        this.classroomController.updateGestureHUD(gestureInfo);
      }
      const hudStatusText = document.getElementById('hudStatusText');
      if (hudStatusText) {
        hudStatusText.textContent = `Gesture: ${gestureInfo.name} (${gestureInfo.desc})`;
      }
    });

    this.classroomController = new ClassroomController(
      this.threeEngine,
      this.gestureEngine,
      (msg) => this.showToast(msg)
    );
    this.classroomController.init();

    this.dashboardController = new DashboardController(
      this.classroomController,
      (msg) => this.showToast(msg)
    );
    this.dashboardController.init();

    // 4. Check Persisted User Session
    this.checkUserSession();

    // 3. Setup Gesture Engine & Classroom Controller
    this.gestureEngine = new GestureEngine(this.threeEngine, (gestureInfo) => {
      if (this.classroomController) {
        this.classroomController.updateGestureHUD(gestureInfo);
      }
      const hudStatusText = document.getElementById('hudStatusText');
      if (hudStatusText) {
        hudStatusText.textContent = `Gesture: ${gestureInfo.name} (${gestureInfo.desc})`;
      }
    });

    this.classroomController = new ClassroomController(
      this.threeEngine,
      this.gestureEngine,
      (msg) => this.showToast(msg)
    );
    this.classroomController.init();

    // 4. Theme Toggle Setup
    this.initThemeToggle();

    // 5. Hero Section 3D Canvas
    const heroCanvasContainer = document.getElementById('heroThreeContainer');
    if (heroCanvasContainer) {
      this.threeEngine.initHeroCanvas(heroCanvasContainer);
    }

    // 6. Hero Button Event Listeners
    document.getElementById('btnStartNow')?.addEventListener('click', () => this.openModal('modalStartClass'));
    document.getElementById('btnJoinNow')?.addEventListener('click', () => this.openModal('modalJoinClass'));
    document.getElementById('cardStartClass')?.addEventListener('click', (e) => {
      if (e.target.id !== 'btnStartNow') this.openModal('modalStartClass');
    });
    document.getElementById('cardJoinClass')?.addEventListener('click', (e) => {
      if (e.target.id !== 'btnJoinNow') this.openModal('modalJoinClass');
    });

    // Hero Sandbox buttons
    document.getElementById('btnToggleSandboxWebcam')?.addEventListener('click', () => {
      this.classroomController.openClassroom('EduGester 3D Sandbox', 'DEMO-999', 'solar', 'teacher');
    });

    // 7. Navigation Smooth Scroll & Active Link
    this.initNavigation();

    // 8. Modals & Real-Time Auth System
    this.initModals();
    this.initRealTimeAuth();

    // 9. Render Classes Catalog Grid
    const classesGrid = document.getElementById('classesGrid');
    if (classesGrid) {
      renderClassesGrid(classesGrid, (modelType, title) => {
        const randomCode = 'EDU-' + Math.floor(1000 + Math.random() * 9000);
        const role = (this.currentUser && this.currentUser.role === 'teacher') ? 'teacher' : 'student';
        this.classroomController.openClassroom(title, randomCode, modelType, role);
      });
    }

    // Catalog Filter Buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const filter = e.currentTarget.dataset.filter;
        renderClassesGrid(classesGrid, (modelType, title) => {
          const randomCode = 'EDU-' + Math.floor(1000 + Math.random() * 9000);
          const role = (this.currentUser && this.currentUser.role === 'teacher') ? 'teacher' : 'student';
          this.classroomController.openClassroom(title, randomCode, filter, role);
        }, filter);
      });
    });

    // Logout Button
    document.getElementById('btnLogout')?.addEventListener('click', () => this.logoutUser());

    // 10. Initialize Classes 1-10 Learning Flow Navigation
    this.initLearningFlow();
  }

  /* ------------------------------------------------------------------------
     CLASSES 1 - 10 LEARNING FLOW NAVIGATION CONTROLLER
     ------------------------------------------------------------------------ */
  initLearningFlow() {
    const btnStartLearning = document.getElementById('btnStartLearning');
    const flowSection = document.getElementById('sectionLearningFlow');
    const stepClass = document.getElementById('stepSelectClass');
    const stepSubject = document.getElementById('stepSelectSubject');
    const stepChapter = document.getElementById('stepSelectChapter');

    const classCardsGrid = document.getElementById('classCardsGrid');
    const subjectCardsGrid = document.getElementById('subjectCardsGrid');
    const chapterCardsGrid = document.getElementById('chapterCardsGrid');

    const breadcrumbs = document.getElementById('flowBreadcrumbs');
    const btnBack = document.getElementById('btnFlowBack');

    const selectedClassBadge = document.getElementById('selectedClassBadge');
    const selectedSubjectBadge = document.getElementById('selectedSubjectBadge');

    let currentClassKey = null;
    let currentSubjectKey = null;

    const showStep = (stepName) => {
      flowSection?.classList.remove('hidden');
      stepClass?.classList.add('hidden');
      stepSubject?.classList.add('hidden');
      stepChapter?.classList.add('hidden');

      if (stepName === 'class') {
        stepClass?.classList.remove('hidden');
        updateBreadcrumbs([
          { name: 'Home', step: 'home' },
          { name: 'Select Class', step: 'class', active: true }
        ]);
      } else if (stepName === 'subject') {
        stepSubject?.classList.remove('hidden');
        updateBreadcrumbs([
          { name: 'Home', step: 'home' },
          { name: `Class ${currentClassKey}`, step: 'class' },
          { name: 'Select Subject', step: 'subject', active: true }
        ]);
      } else if (stepName === 'chapter') {
        stepChapter?.classList.remove('hidden');
        updateBreadcrumbs([
          { name: 'Home', step: 'home' },
          { name: `Class ${currentClassKey}`, step: 'class' },
          { name: currentSubjectKey, step: 'subject' },
          { name: 'Select Chapter', step: 'chapter', active: true }
        ]);
      }

      flowSection?.scrollIntoView({ behavior: 'smooth' });
    };

    const updateBreadcrumbs = (crumbs) => {
      if (!breadcrumbs) return;
      breadcrumbs.innerHTML = crumbs.map(c => `
        <span class="crumb ${c.active ? 'active' : ''}" data-step="${c.step}">
          ${c.name}
        </span>
      `).join('<span class="crumb-separator">&gt;</span>');

      breadcrumbs.querySelectorAll('.crumb').forEach(el => {
        el.addEventListener('click', (e) => {
          const step = e.currentTarget.dataset.step;
          if (step === 'home') {
            flowSection?.classList.add('hidden');
            document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
          } else if (step === 'class') {
            renderClassesStep();
          } else if (step === 'subject') {
            if (currentClassKey) renderSubjectsStep(currentClassKey);
          }
        });
      });
    };

    const renderClassesStep = () => {
      currentClassKey = null;
      currentSubjectKey = null;
      showStep('class');
      if (!classCardsGrid) return;

      classCardsGrid.innerHTML = '';
      for (let i = 1; i <= 10; i++) {
        const classKey = String(i);
        const data = CURRICULUM_DATA[classKey] || {
          title: `Class ${i}`,
          desc: `Interactive 3D Curriculum for Class ${i}`,
          icon: '🎓'
        };

        const card = document.createElement('div');
        card.className = 'edu-class-card';
        card.innerHTML = `
          <div class="edu-card-badge">${i}</div>
          <div class="edu-card-icon">${data.icon || '📚'}</div>
          <h3>${data.title}</h3>
          <p>${data.desc}</p>
          <button class="btn btn-primary btn-sm green-btn w-full btn-select-class" data-class="${i}">
            Select &rarr;
          </button>
        `;
        classCardsGrid.appendChild(card);
      }

      classCardsGrid.querySelectorAll('.btn-select-class, .edu-class-card').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const target = e.currentTarget.classList.contains('btn-select-class') 
            ? e.currentTarget 
            : e.currentTarget.querySelector('.btn-select-class');
          if (target) {
            const classNum = target.dataset.class;
            renderSubjectsStep(classNum);
          }
        });
      });
    };

    const renderSubjectsStep = (classNum) => {
      currentClassKey = classNum;
      currentSubjectKey = null;
      if (selectedClassBadge) selectedClassBadge.textContent = `Class ${classNum}`;
      showStep('subject');

      if (!subjectCardsGrid) return;
      subjectCardsGrid.innerHTML = '';

      const classData = CURRICULUM_DATA[classNum];
      const subjectsObj = classData ? classData.subjects : {};
      const subjectNames = Object.keys(subjectsObj);

      if (subjectNames.length === 0) {
        subjectCardsGrid.innerHTML = `<div class="empty-state">No subjects found for Class ${classNum}</div>`;
        return;
      }

      subjectNames.forEach(subName => {
        const subData = subjectsObj[subName];
        const chapterCount = subData.chapters ? subData.chapters.length : 0;

        const card = document.createElement('div');
        card.className = 'edu-subject-card';
        card.innerHTML = `
          <div class="edu-sub-icon">${subData.icon || '🔬'}</div>
          <div class="edu-sub-info">
            <h3>${subName}</h3>
            <span class="edu-sub-count">${chapterCount} Interactive Chapters</span>
          </div>
          <button class="btn btn-primary btn-sm blue-btn btn-select-subject" data-subject="${subName}">
            Select Subject &rarr;
          </button>
        `;
        subjectCardsGrid.appendChild(card);
      });

      subjectCardsGrid.querySelectorAll('.btn-select-subject, .edu-subject-card').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const target = e.currentTarget.classList.contains('btn-select-subject')
            ? e.currentTarget
            : e.currentTarget.querySelector('.btn-select-subject');
          if (target) {
            const subName = target.dataset.subject;
            renderChaptersStep(classNum, subName);
          }
        });
      });
    };

    const renderChaptersStep = (classNum, subName) => {
      currentClassKey = classNum;
      currentSubjectKey = subName;
      if (selectedSubjectBadge) selectedSubjectBadge.textContent = `Class ${classNum} > ${subName}`;
      showStep('chapter');

      if (!chapterCardsGrid) return;
      chapterCardsGrid.innerHTML = '';

      const classData = CURRICULUM_DATA[classNum];
      const subData = classData && classData.subjects ? classData.subjects[subName] : null;
      const chapters = subData ? subData.chapters : [];

      if (chapters.length === 0) {
        chapterCardsGrid.innerHTML = `<div class="empty-state">No chapters found for ${subName}</div>`;
        return;
      }

      chapters.forEach((chap, idx) => {
        const card = document.createElement('div');
        card.className = 'edu-chapter-card';
        const modelBadgeText = chap.model === 'coming-soon' ? '⏳ Model Coming Soon' : '✨ 3D Interactive Model';
        
        card.innerHTML = `
          <div class="edu-chap-header">
            <span class="edu-chap-num">Chapter ${chap.chapterNumber || idx + 1}</span>
            <span class="edu-chap-model-badge ${chap.model === 'coming-soon' ? 'coming' : 'active'}">${modelBadgeText}</span>
          </div>
          <h3 class="edu-chap-title">${chap.title}</h3>
          <p class="edu-chap-desc">${chap.desc}</p>
          <div class="edu-chap-footer">
            <button class="btn btn-primary btn-sm green-btn btn-open-chapter" data-model="${chap.model}" data-title="${chap.title}" data-desc="${chap.desc}">
              Open Chapter &rarr;
            </button>
          </div>
        `;
        chapterCardsGrid.appendChild(card);
      });

      chapterCardsGrid.querySelectorAll('.btn-open-chapter').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const modelType = e.currentTarget.dataset.model;
          const chapTitle = e.currentTarget.dataset.title;
          const chapDesc = e.currentTarget.dataset.desc;

          const roomCode = `${subName.substring(0, 3).toUpperCase()}${currentClassKey}X${Math.floor(10 + Math.random() * 89)}`;
          // Enable full interactive teacher/explanation mode for chapter sessions
          const userRole = 'teacher';

          this.classroomController.openClassroom(
            `${chapTitle} - Class ${currentClassKey}`,
            roomCode,
            modelType,
            userRole,
            {
              className: `Class ${currentClassKey}`,
              subjectName: currentSubjectKey,
              chapterTitle: chapTitle,
              chapterDesc: chapDesc
            }
          );
        });
      });
    };

    btnStartLearning?.addEventListener('click', () => {
      renderClassesStep();
    });

    btnBack?.addEventListener('click', () => {
      if (stepChapter && !stepChapter.classList.contains('hidden')) {
        if (currentClassKey) renderSubjectsStep(currentClassKey);
      } else if (stepSubject && !stepSubject.classList.contains('hidden')) {
        renderClassesStep();
      } else {
        flowSection?.classList.add('hidden');
        document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  /* ------------------------------------------------------------------------
     THEME TOGGLE SYSTEM
     ------------------------------------------------------------------------ */
  initThemeToggle() {
    const themeBtn = document.getElementById('themeToggle');
    const htmlEl = document.documentElement;

    const savedTheme = localStorage.getItem('edugester_theme') || 'light';
    htmlEl.setAttribute('data-theme', savedTheme);

    themeBtn?.addEventListener('click', () => {
      const current = htmlEl.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      htmlEl.setAttribute('data-theme', next);
      localStorage.setItem('edugester_theme', next);
      this.showToast(`Switched to ${next.toUpperCase()} mode`);
    });
  }

  /* ------------------------------------------------------------------------
     NAVIGATION CONTROLLER
     ------------------------------------------------------------------------ */
  initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + 100;
      const sections = document.querySelectorAll('section[id]');
      sections.forEach(sec => {
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        const id = sec.getAttribute('id');
        if (scrollPos >= top && scrollPos < top + height) {
          navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.nav === id);
          });
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     REAL-TIME AUTHENTICATION SYSTEM
     ------------------------------------------------------------------------ */
  checkUserSession() {
    if (authService.isLoggedIn()) {
      this.currentUser = authService.currentUser;
      this.updateNavUserBadge();
      this.showDashboardForUser();
    }
  }

  showDashboardForUser() {
    const teacherDash = document.getElementById('sectionTeacherDashboard');
    const studentDash = document.getElementById('sectionStudentDashboard');

    if (this.currentUser) {
      if (this.currentUser.role === 'teacher') {
        teacherDash?.classList.remove('hidden');
        studentDash?.classList.add('hidden');
        this.dashboardController.loadTeacherDashboard();
      } else {
        studentDash?.classList.remove('hidden');
        teacherDash?.classList.add('hidden');
        this.dashboardController.loadStudentDashboard();
      }
    } else {
      teacherDash?.classList.add('hidden');
      studentDash?.classList.add('hidden');
    }
  }

  updateNavUserBadge() {
    const guestActions = document.getElementById('authGuestActions');
    const profileBadge = document.getElementById('userProfileBadge');
    const avatarPill = document.getElementById('userAvatarPill');
    const badgeName = document.getElementById('userBadgeName');
    const badgeRole = document.getElementById('userBadgeRole');

    if (this.currentUser) {
      if (guestActions) guestActions.classList.add('hidden');
      if (profileBadge) profileBadge.classList.remove('hidden');

      const initials = (this.currentUser.name || 'User')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

      if (avatarPill) avatarPill.textContent = initials;
      if (badgeName) badgeName.textContent = this.currentUser.name;
      if (badgeRole) badgeRole.textContent = this.currentUser.role.toUpperCase();

      const studentNameInput = document.getElementById('studentName');
      if (studentNameInput) studentNameInput.value = this.currentUser.name;
    } else {
      if (guestActions) guestActions.classList.remove('hidden');
      if (profileBadge) profileBadge.classList.add('hidden');
    }
  }

  initRealTimeAuth() {
    const emailInput = document.getElementById('authEmail');
    const passInput = document.getElementById('authPassword');
    const emailError = document.getElementById('emailError');
    const strengthFill = document.getElementById('passwordStrengthFill');
    const strengthText = document.getElementById('passwordStrengthText');

    emailInput?.addEventListener('input', () => {
      const val = emailInput.value.trim();
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (val && !isValid) {
        emailError?.classList.remove('hidden');
      } else {
        emailError?.classList.add('hidden');
      }
    });

    passInput?.addEventListener('input', () => {
      const val = passInput.value;
      if (!val) {
        if (strengthFill) strengthFill.style.width = '0%';
        if (strengthText) strengthText.textContent = 'Strength: Empty';
        return;
      }

      let score = 0;
      if (val.length >= 6) score += 25;
      if (val.length >= 10) score += 25;
      if (/[A-Z]/.test(val) || /[0-9]/.test(val)) score += 25;
      if (/[^A-Za-z0-9]/.test(val)) score += 25;

      if (strengthFill) {
        strengthFill.style.width = `${score}%`;
        if (score <= 25) strengthFill.style.backgroundColor = '#ef4444';
        else if (score <= 50) strengthFill.style.backgroundColor = '#f59e0b';
        else if (score <= 75) strengthFill.style.backgroundColor = '#3b82f6';
        else strengthFill.style.backgroundColor = '#10b981';
      }

      if (strengthText) {
        let label = 'Weak';
        if (score > 25 && score <= 50) label = 'Medium';
        else if (score > 50 && score <= 75) label = 'Strong';
        else if (score > 75) label = 'Excellent';
        strengthText.textContent = `Strength: ${label}`;
      }
    });

    document.querySelectorAll('.role-option').forEach(option => {
      option.addEventListener('click', (e) => {
        document.querySelectorAll('.role-option').forEach(o => o.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const radio = e.currentTarget.querySelector('input');
        if (radio) radio.checked = true;
      });
    });

    document.getElementById('btnGoogleAuth')?.addEventListener('click', async () => {
      const res = await authService.login('alex.rivera@student.edu', 'password123');
      if (res.success) {
        this.currentUser = res.user;
        this.updateNavUserBadge();
        this.showDashboardForUser();
        this.closeModal('modalAuth');
        this.showToast('Signed in as Student (Alex Rivera)');
      }
    });

    document.getElementById('btnMicrosoftAuth')?.addEventListener('click', async () => {
      const res = await authService.login('dr.jenkins@harvard.edu', 'password123');
      if (res.success) {
        this.currentUser = res.user;
        this.updateNavUserBadge();
        this.showDashboardForUser();
        this.closeModal('modalAuth');
        this.showToast('Signed in as Teacher (Dr. Sarah Jenkins)');
      }
    });
  }

  logoutUser() {
    authService.logout();
    this.currentUser = null;
    this.updateNavUserBadge();
    this.showDashboardForUser();
    this.showToast('Logged out successfully.');
  }

  /* ------------------------------------------------------------------------
     MODALS CONTROLLER
     ------------------------------------------------------------------------ */
  initModals() {
    document.getElementById('btnLogin')?.addEventListener('click', () => this.openAuthModal('login'));
    document.getElementById('btnSignUp')?.addEventListener('click', () => this.openAuthModal('signup'));

    document.getElementById('btnCloseStartModal')?.addEventListener('click', () => this.closeModal('modalStartClass'));
    document.getElementById('btnCloseJoinModal')?.addEventListener('click', () => this.closeModal('modalJoinClass'));
    document.getElementById('btnCloseCreateClassModal')?.addEventListener('click', () => this.closeModal('modalCreateClass'));
    document.getElementById('btnCloseAuthModal')?.addEventListener('click', () => this.closeModal('modalAuth'));

    document.getElementById('btnOpenCreateClassModal')?.addEventListener('click', () => this.openModal('modalCreateClass'));

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
      });
    });

    // Form Auth Submit
    document.getElementById('formAuth')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;
      const fullName = document.getElementById('authFullName')?.value.trim() || 'Alex Rivera';
      const roleInput = document.querySelector('input[name="role"]:checked')?.value || 'student';
      const isSignUp = document.getElementById('tabSignUp')?.classList.contains('active');

      let res;
      if (isSignUp) {
        res = await authService.register(email, password, fullName, roleInput);
      } else {
        res = await authService.login(email, password);
      }

      if (res.success) {
        this.currentUser = res.user;
        this.updateNavUserBadge();
        this.showDashboardForUser();
        this.closeModal('modalAuth');
        this.showToast(`Welcome to GesturesLearn, ${res.user.name}! (${res.user.role.toUpperCase()})`);
      } else {
        this.showToast(`⚠️ ${res.error}`);
      }
    });

    // Start Class Form Submit (Teacher Role)
    document.getElementById('formStartClass')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('classTitle').value;
      const subject = document.getElementById('subjectSelect').value;
      const code = document.getElementById('generatedClassCode').value;
      this.closeModal('modalStartClass');
      this.classroomController.openClassroom(title, code, subject, 'teacher');
    });

    // Join Class Form Submit (Student Role)
    document.getElementById('formJoinClass')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = document.getElementById('joinClassCode').value.toUpperCase();
      const name = document.getElementById('studentName').value;
      this.closeModal('modalJoinClass');

      const nameEl = document.getElementById('currentUserName');
      if (nameEl) nameEl.textContent = `${name} (You)`;

      this.classroomController.openClassroom('Joined Interactive Class Session', code, 'solar', 'student');
    });

    // Auth Tabs Switch (Sign In vs Create Account)
    const tabLogin = document.getElementById('tabLogin');
    const tabSignUp = document.getElementById('tabSignUp');
    const groupFullName = document.getElementById('groupFullName');
    const groupRole = document.getElementById('groupRole');
    const groupPasswordStrength = document.getElementById('groupPasswordStrength');
    const authBtn = document.getElementById('authSubmitBtn');

    tabLogin?.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabSignUp.classList.remove('active');
      groupFullName?.classList.add('hidden');
      groupRole?.classList.add('hidden');
      groupPasswordStrength?.classList.add('hidden');
      if (authBtn) authBtn.textContent = 'Sign In';
    });

    tabSignUp?.addEventListener('click', () => {
      tabSignUp.classList.add('active');
      tabLogin.classList.remove('active');
      groupFullName?.classList.remove('hidden');
      groupRole?.classList.remove('hidden');
      groupPasswordStrength?.classList.remove('hidden');
      if (authBtn) authBtn.textContent = 'Create Account';
    });

    // Form Auth Submit
    document.getElementById('formAuth')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmail').value.trim();
      const fullName = document.getElementById('authFullName')?.value.trim() || 'Alex Rivera';
      const roleInput = document.querySelector('input[name="role"]:checked')?.value || 'student';

      this.loginUser(email, fullName, roleInput);
      this.showToast(`Welcome to EduGester, ${fullName}!`);
    });

    // Copy Code Button
    document.getElementById('btnCopyCode')?.addEventListener('click', () => {
      const codeInput = document.getElementById('generatedClassCode');
      if (codeInput) {
        navigator.clipboard.writeText(codeInput.value);
        this.showToast('Class code copied to clipboard!');
      }
    });
  }

  openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('active');
  }

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('active');
  }

  openAuthModal(tab = 'login') {
    this.openModal('modalAuth');
    if (tab === 'signup') {
      document.getElementById('tabSignUp')?.click();
    } else {
      document.getElementById('tabLogin')?.click();
    }
  }

  /* ------------------------------------------------------------------------
     TOAST NOTIFICATIONS
     ------------------------------------------------------------------------ */
  showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span style="color:#10b981; font-weight:bold;">✓</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new EduGesterApp();
  app.init();
});
