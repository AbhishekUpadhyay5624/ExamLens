import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setToken, getToken, TOKEN_KEY, USER_KEY } from "./api";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistSession(token, user) {
  setToken(token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [token, setTokenState] = useState(() => getToken());
  // `bootstrapping` is true until we've validated an existing token on load.
  const [bootstrapping, setBootstrapping] = useState(() => Boolean(getToken()));

  // If we have a token on first load, confirm it's still valid (and refresh
  // the user record) via /auth/me. On failure, drop the session silently.
  useEffect(() => {
    let active = true;
    if (!token) {
      setBootstrapping(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        if (!active) return;
        setUser(res.data);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data));
      })
      .catch(() => {
        if (!active) return;
        setToken(null);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setTokenState(null);
      })
      .finally(() => {
        if (active) setBootstrapping(false);
      });
    return () => {
      active = false;
    };
    // Run once on mount; token changes via login/logout handle their own state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    const { access_token, user: u } = res.data;
    persistSession(access_token, u);
    setUser(u);
    setTokenState(access_token);
    return u;
  }

  async function register(name, email, password) {
    const res = await api.post("/auth/register", { name, email, password });
    const { access_token, user: u } = res.data;
    persistSession(access_token, u);
    setUser(u);
    setTokenState(access_token);
    return u;
  }

  async function googleLogin(token) {
    const res = await api.post("/auth/google", { token });
    const { access_token, user: u } = res.data;
    persistSession(access_token, u);
    setUser(u);
    setTokenState(access_token);
    return u;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setTokenState(null);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      bootstrapping,
      login,
      register,
      googleLogin,
      logout,
    }),
    [user, token, bootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
