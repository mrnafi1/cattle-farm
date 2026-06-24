import { createContext, useContext, useState } from "react";
import { translations } from "../data/translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("bn");

  const t = (key) => translations[language][key] || key;

  const toggleLanguage = () =>
    setLanguage((prev) => (prev === "bn" ? "en" : "bn"));

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
