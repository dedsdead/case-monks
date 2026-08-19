import { Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LeaderSelector } from "./LeaderSelector";

export function Layout() {
  const { employeeId, clearEmployee } = useAuth();

  if (!employeeId) {
    return <LeaderSelector />;
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1.5rem",
          borderBottom: "1px solid var(--color-border)",
          backgroundColor: "var(--color-background)",
        }}
      >
        <a
          href="/"
          style={{
            color: "var(--color-primary)",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "1.1rem",
          }}
        >
          Avaliação de Liderados
        </a>
        <button
          onClick={clearEmployee}
          style={{
            padding: "0.4rem 0.8rem",
            backgroundColor: "var(--color-border)",
            color: "var(--color-primary)",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          Trocar identidade
        </button>
      </header>
      <main style={{ padding: "1.5rem" }}>
        <Outlet />
      </main>
    </div>
  );
}
