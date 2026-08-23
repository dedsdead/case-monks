import { Link } from "react-router-dom";

export function NotFound() {
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
        Página não encontrada
      </h1>
      <Link
        to="/"
        style={{
          color: "var(--color-primary)",
          textDecoration: "underline",
          fontSize: "1.1rem",
        }}
      >
        Voltar para o início
      </Link>
    </div>
  );
}
