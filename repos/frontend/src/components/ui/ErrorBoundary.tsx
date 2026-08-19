import type { ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  // Simple error handling - just render children with fallback
  // In a real app, you might want to use React Error Boundary hooks
  // but for this simple case, we'll use a basic approach
  
  try {
    return <>{children}</>;
  } catch (error) {
    console.error("Error caught:", error);
    
    return fallback || (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
          textAlign: "center",
        }}
      >
        <h2 style={{ color: "var(--color-primary)", marginBottom: "1rem" }}>
          Algo deu errado
        </h2>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "0.5rem 1.5rem",
            backgroundColor: "var(--color-primary)",
            color: "var(--color-background)",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }
}
