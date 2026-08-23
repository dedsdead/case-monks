import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

export function NotFound() {
  const { t } = useLanguage();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1rem",
        textAlign: "center",
      }}
    >
      <h1 style={{ color: "var(--color-primary)", marginBottom: "1rem" }}>
        {t('pageNotFound')}
      </h1>
      <Link
        to="/"
        style={{
          color: "var(--color-primary)",
          textDecoration: "underline",
          fontSize: "1.1rem",
        }}
      >
        {t('backToHome')}
      </Link>
    </div>
  );
}
