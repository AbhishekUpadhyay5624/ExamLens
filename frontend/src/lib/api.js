import axios from "axios";

// localStorage keys (shared with lib/auth.jsx).
export const TOKEN_KEY = "examlens_token";
export const USER_KEY = "examlens_user";

// Backend base URL comes from Vite env; we append the API prefix here so the
// rest of the app calls relative paths like api.get("/exams").
const baseURL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/api`;

export const api = axios.create({ baseURL });

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Attach the bearer token to every request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 (expired/invalid token), clear the session and bounce to /login.
// Guarded so we don't loop while already on an auth page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register") {
        // Preserve where the user was headed so we can bounce back post-login.
        const next = encodeURIComponent(path + window.location.search);
        window.location.assign(`/login?next=${next}`);
      }
    }
    return Promise.reject(error);
  }
);

// Pull a human-readable message out of an axios error (FastAPI puts it in
// response.data.detail; validation errors come back as an array).
export function apiErrorMessage(error, fallback = "Something went wrong.") {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) {
    const first = detail[0];
    if (first?.msg) return first.msg;
  }
  if (error?.message) return error.message;
  return fallback;
}
