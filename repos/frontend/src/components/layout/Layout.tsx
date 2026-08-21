import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../i18n/LanguageContext";
import { LeaderSelector } from "./LeaderSelector";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Layout() {
  const { employeeId, clearEmployee } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (!employeeId) {
    return <LeaderSelector />;
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-background)" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 2rem",
          borderBottom: "1px solid var(--color-border)",
          backgroundColor: "var(--color-background)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <Link
          to="/"
          style={{
            color: "var(--color-primary)",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{
            fontSize: "1.5rem",
            display: "inline-block",
          }}>
            ⭐
          </span>
          Avaliações
        </Link>

        <nav style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Link
            to="/"
            style={{
              color: isActive("/") ? "var(--color-primary)" : "var(--color-muted)",
              textDecoration: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "8px",
              backgroundColor: isActive("/") ? "var(--color-border)" : "transparent",
              fontSize: "0.95rem",
              fontWeight: isActive("/") ? 600 : 500,
              transition: "all 0.2s ease",
            }}
          >
            {t('home')}
          </Link>
          <Link
            to="/history"
            style={{
              color: isActive("/history") ? "var(--color-primary)" : "var(--color-muted)",
              textDecoration: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "8px",
              backgroundColor: isActive("/history") ? "var(--color-border)" : "transparent",
              fontSize: "0.95rem",
              fontWeight: isActive("/history") ? 600 : 500,
              transition: "all 0.2s ease",
            }}
          >
            {t('evaluationHistory')}
          </Link>
        </nav>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <LanguageSwitcher />
          <button
            onClick={clearEmployee}
            style={{
              padding: "0.6rem 1.2rem",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-background)",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 500,
              transition: "all 0.2s ease",
            }}
          >
            {t('selectIdentity')}
          </button>
        </div>
      </header>
      <main style={{ padding: "2rem" }}>
        <Outlet />
      </main>
    </div>
  );
}
