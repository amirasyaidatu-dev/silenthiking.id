import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null); // null=checking, false=guest, obj=authed
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("sh_token");
    if (!token) { setAdmin(false); setChecked(true); return; }
    api.get("/auth/me")
      .then((r) => setAdmin(r.data))
      .catch(() => { localStorage.removeItem("sh_token"); setAdmin(false); })
      .finally(() => setChecked(true));
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post("/auth/login", { username, password });
    localStorage.setItem("sh_token", data.token);
    setAdmin(data.admin);
    return data.admin;
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    localStorage.removeItem("sh_token");
    setAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ admin, checked, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
