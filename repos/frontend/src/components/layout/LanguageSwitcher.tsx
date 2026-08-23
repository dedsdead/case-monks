import { useLanguage, type Language } from "../../i18n/LanguageContext";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
  };

  return (
    <div role="group" aria-label={language === 'pt-BR' ? 'Idioma' : 'Language'} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <button
        onClick={() => handleLanguageChange("pt-BR")}
        aria-pressed={language === "pt-BR"}
        style={{
          padding: "0.25rem 0.5rem",
          border: "1px solid var(--color-border)",
          borderRadius: "4px",
          background: language === "pt-BR" ? "var(--color-primary)" : "transparent",
          color: language === "pt-BR" ? "white" : "var(--color-muted)",
          cursor: "pointer",
          fontSize: "0.75rem",
        }}
      >
        PT
      </button>
      <button
        onClick={() => handleLanguageChange("en")}
        aria-pressed={language === "en"}
        style={{
          padding: "0.25rem 0.5rem",
          border: "1px solid var(--color-border)",
          borderRadius: "4px",
          background: language === "en" ? "var(--color-primary)" : "transparent",
          color: language === "en" ? "white" : "var(--color-muted)",
          cursor: "pointer",
          fontSize: "0.75rem",
        }}
      >
        EN
      </button>
    </div>
  );
}