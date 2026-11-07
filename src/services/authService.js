import { apiRequest } from "./apiClient";
import { BACKEND_MODE, API_URLS } from "../config/backend";

const USERS_KEY = "msoa-shop-users";
const SESSION_KEY = "msoa-shop-session";

const demoUsers = [
  {
    id: "user-1",
    name: "Demo Customer",
    email: "demo@msoa.shop",
    password: "demo123",
    role: "CUSTOMER"
  }
];

function loadUsers() {
  try {
    const saved = localStorage.getItem(USERS_KEY);
    return saved ? JSON.parse(saved) : demoUsers;
  } catch {
    return demoUsers;
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function publicUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

const request = (path, options) =>
  apiRequest(API_URLS.AUTH, path, options);

export const authService = {
  async login(email, password) {
    if (BACKEND_MODE.AUTH === "rest") {
      const session = await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      if (!session?.user || !session?.token) {
        throw new Error("Invalid authentication response.");
      }

      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify(session)
      );

      return session;
    }

    const user = loadUsers().find(
      (item) =>
        item.email.toLowerCase() === email.trim().toLowerCase() &&
        item.password === password
    );

    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const session = {
      user: publicUser(user),
      token: `mock-${crypto.randomUUID()}`
    };

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(session)
    );

    return session;
  },

  async register(name, email, password) {
    if (BACKEND_MODE.AUTH === "rest") {
      return request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password })
      });
    }

    const users = loadUsers();
    const normalizedEmail = email.trim().toLowerCase();

    if (!name.trim() || !normalizedEmail || !password) {
      throw new Error("All fields are required.");
    }

    if (
      users.some(
        (user) => user.email.toLowerCase() === normalizedEmail
      )
    ) {
      throw new Error("Email already registered.");
    }

    const user = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "CUSTOMER"
    };

    users.push(user);
    saveUsers(users);

    return publicUser(user);
  },

  async logout() {
    if (BACKEND_MODE.AUTH === "rest") {
      try {
        await request("/api/auth/logout", {
          method: "POST"
        });
      } finally {
        localStorage.removeItem(SESSION_KEY);
      }

      return { success: true };
    }

    localStorage.removeItem(SESSION_KEY);
    return { success: true };
  },

  async getCurrentUser() {
    if (BACKEND_MODE.AUTH === "rest") {
      const session = getSession();

      if (!session?.token) return null;

      try {
        return await request("/api/auth/me");
      } catch {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
    }

    return getSession()?.user ?? null;
  }
};
