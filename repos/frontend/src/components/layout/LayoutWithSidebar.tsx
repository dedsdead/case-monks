import { useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../i18n/LanguageContext";
import { LeaderSelector } from "./LeaderSelector";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface SidebarItem {
  path: string;
  label: string;
  icon?: string;
}

export function Layout() {
  const { employeeId, clearEmployee } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth > 768,
  );
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 768,
  );

  useEffect(() => {
    // Sync sidebar with viewport on resize
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  if (!employeeId) {
    return <LeaderSelector />;
  }

  const navigationItems: SidebarItem[] = [
    { path: "/", label: t('home') },
    { path: "/history", label: t('evaluationHistory') },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{
          width: isMobile && !sidebarOpen ? "0" : sidebarOpen ? "250px" : "60px",
          minWidth: isMobile && !sidebarOpen ? "0" : sidebarOpen ? "250px" : "60px",
          backgroundColor: "var(--color-background)",
          borderRight: "1px solid var(--color-border)",
          transition: "width 0.3s ease, min-width 0.3s ease",
          display: isMobile && !sidebarOpen ? "none" : "flex",
          flexDirection: "column",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          aria-label={t('toggleMenu')}
          style={{
            position: "absolute",
            top: "1rem",
            right: isMobile ? "-15px" : "-15px",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            backgroundColor: "var(--color-primary)",
            color: "var(--color-background)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.8rem",
            zIndex: 10,
          }}
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>

        {/* Logo/App Title */}
        <div
          style={{
            padding: "2rem 1rem 1rem",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          {sidebarOpen && (
            <Link
              to="/"
              style={{
                color: "var(--color-primary)",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "1.2rem",
                display: "block",
              }}
            >
              Avaliações
            </Link>
          )}
        </div>

        {/* Navigation Menu */}
        <nav
          style={{
            flex: 1,
            padding: "1rem 0",
            overflowY: "auto",
          }}
        >
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: "block",
                padding: sidebarOpen ? "0.75rem 1.5rem" : "0.75rem",
                color: isActive(item.path) ? "var(--color-primary)" : "var(--color-muted)",
                textDecoration: "none",
                backgroundColor: isActive(item.path) ? "var(--color-border)" : "transparent",
                transition: "all 0.2s ease",
                position: "relative",
                whiteSpace: "nowrap",
              }}
            >
              {sidebarOpen && (
                <span
                  style={{
                    display: "inline-block",
                    width: "4px",
                    height: "20px",
                    backgroundColor: isActive(item.path) ? "var(--color-primary)" : "transparent",
                    position: "absolute",
                    left: "0",
                    top: "50%",
                    transform: "translateY(-50%)",
                    borderRadius: "0 2px 2px 0",
                  }}
                />
              )}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Info */}
        <div
          style={{
            padding: "1rem",
            borderTop: "1px solid var(--color-border)",
            fontSize: "0.85rem",
            color: "var(--color-muted)",
          }}
        >
          {sidebarOpen && (
            <div>
              <div style={{ marginBottom: "0.5rem" }}>
                <strong style={{ color: "var(--color-primary)" }}>
                  {employeeId}
                </strong>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <LanguageSwitcher />
                <button onClick={clearEmployee} className="btn btn-secondary" style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", borderRadius: "4px" }}>
                  {t('selectIdentity')}
                </button>
              </div>
            </div>
          )}
          {!sidebarOpen && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <LanguageSwitcher />
              <button onClick={clearEmployee} className="btn btn-secondary" style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", borderRadius: "4px" }}>
                🔄
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          marginLeft: isMobile && !sidebarOpen ? "0" : sidebarOpen ? "250px" : "60px",
          transition: "margin-left 0.3s ease",
        }}
      >
        {/* Top Bar */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
            backgroundColor: "var(--color-background)",
            minHeight: "60px",
          }}
        >
          <div>
            <h1
              style={{
                color: "var(--color-primary)",
                margin: 0,
                fontSize: "1.5rem",
                fontWeight: 600,
              }}
            >
              {location.pathname === "/" && t('home')}
              {location.pathname === "/history" && t('evaluationHistory')}
              {location.pathname.startsWith("/evaluate/") && "Avaliação"}
              {location.pathname.startsWith("/history/") && "Histórico"}
            </h1>
          </div>
          
          {/* Mobile Menu Toggle - only show on mobile */}
          {isMobile && (
            <button
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? t('close') : t('openMenu')}
              style={{
                padding: "0.5rem",
                backgroundColor: "var(--color-border)",
                color: "var(--color-primary)",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "1.2rem",
              }}
            >
              {sidebarOpen ? "✕" : "☰"}
            </button>
          )}
        </header>

        {/* Page Content */}
        <main
          style={{
            flex: 1,
            padding: "1.5rem",
            overflow: "auto",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}