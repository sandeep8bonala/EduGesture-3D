/* ==========================================================================
   EduGester - Authentication Client Service (Role-Based JWT/Session Auth)
   ========================================================================== */

export class AuthService {
  constructor() {
    const host = window.location.hostname || 'localhost';
    this.apiBase = `http://${host}:8080/api/auth`;
    this.currentUser = null;
    this.token = localStorage.getItem('edugester_token') || null;

    this.checkSession();
  }

  checkSession() {
    const storedUser = localStorage.getItem('edugester_user');
    if (storedUser && this.token) {
      try {
        this.currentUser = JSON.parse(storedUser);
      } catch (e) {
        this.logout();
      }
    }
  }

  async register(email, password, name, role = 'student') {
    try {
      const res = await fetch(`${this.apiBase}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      this.token = data.token;
      this.currentUser = data.user;
      localStorage.setItem('edugester_token', data.token);
      localStorage.setItem('edugester_user', JSON.stringify(data.user));

      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async login(email, password) {
    try {
      const res = await fetch(`${this.apiBase}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      this.token = data.token;
      this.currentUser = data.user;
      localStorage.setItem('edugester_token', data.token);
      localStorage.setItem('edugester_user', JSON.stringify(data.user));

      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  logout() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('edugester_token');
    localStorage.removeItem('edugester_user');
  }

  isLoggedIn() {
    return !!(this.token && this.currentUser);
  }

  isTeacher() {
    return this.currentUser && this.currentUser.role === 'teacher';
  }

  isStudent() {
    return this.currentUser && this.currentUser.role === 'student';
  }
}

export const authService = new AuthService();
