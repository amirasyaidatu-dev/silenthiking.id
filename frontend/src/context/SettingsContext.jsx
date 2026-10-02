import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const SettingsContext = createContext({ settings: {}, loading: true });

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/settings/public")
      .then((r) => setSettings(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
