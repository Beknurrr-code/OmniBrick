// Ultra-minimal, real working Authentication Service for OmniBrick
// Handles persistent registration, login, and session state.

export interface AuthUser {
  username: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: AuthUser;
}

const USERS_STORAGE_KEY = "omnibrick_users_v1";
const SESSION_STORAGE_KEY = "omnibrick_auth_session_v1";

interface StoredUser {
  username: string;
  passwordHash: string;
  createdAt: string;
}

class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: Set<(user: AuthUser | null) => void> = new Set();

  constructor() {
    this.loadSession();
  }

  private loadSession(): void {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        this.currentUser = JSON.parse(saved);
      }
    } catch {
      this.currentUser = null;
    }
  }

  private getStoredUsers(): Record<string, StoredUser> {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private saveStoredUsers(users: Record<string, StoredUser>): void {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn("Failed to persist users:", e);
    }
  }

  public getCurrentUser(): AuthUser | null {
    if (!this.currentUser) {
      this.loadSession();
    }
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  public register(usernameRaw: string, passwordRaw: string): AuthResponse {
    const username = usernameRaw.trim();
    const password = passwordRaw.trim();

    if (!username || username.length < 2) {
      return { success: false, error: "Логин должен быть от 2 символов" };
    }
    if (!password || password.length < 4) {
      return { success: false, error: "Пароль должен быть от 4 символов" };
    }

    const users = this.getStoredUsers();
    const key = username.toLowerCase();

    if (users[key]) {
      return { success: false, error: "Пользователь с таким логином уже существует" };
    }

    const newUser: StoredUser = {
      username,
      passwordHash: btoa(encodeURIComponent(password)),
      createdAt: new Date().toISOString(),
    };

    users[key] = newUser;
    this.saveStoredUsers(users);

    const authUser: AuthUser = {
      username: newUser.username,
      createdAt: newUser.createdAt,
    };

    this.setSession(authUser);
    return { success: true, user: authUser };
  }

  public login(usernameRaw: string, passwordRaw: string): AuthResponse {
    const username = usernameRaw.trim();
    const password = passwordRaw.trim();

    if (!username || !password) {
      return { success: false, error: "Введите логин и пароль" };
    }

    const users = this.getStoredUsers();
    const key = username.toLowerCase();
    const existing = users[key];

    if (!existing) {
      return { success: false, error: "Пользователь не найден. Зарегистрируйтесь." };
    }

    const enteredHash = btoa(encodeURIComponent(password));
    if (existing.passwordHash !== enteredHash) {
      return { success: false, error: "Неверный пароль" };
    }

    const authUser: AuthUser = {
      username: existing.username,
      createdAt: existing.createdAt,
    };

    this.setSession(authUser);
    return { success: true, user: authUser };
  }

  public logout(): void {
    this.currentUser = null;
    localStorage.removeItem(SESSION_STORAGE_KEY);
    this.notifyListeners();
  }

  private setSession(user: AuthUser): void {
    this.currentUser = user;
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn("Failed to save session:", e);
    }
    this.notifyListeners();
  }

  public subscribe(fn: (user: AuthUser | null) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notifyListeners(): void {
    this.listeners.forEach((fn) => fn(this.currentUser));
  }
}

export const authService = new AuthService();
