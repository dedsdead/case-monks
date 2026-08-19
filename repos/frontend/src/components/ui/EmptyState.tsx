interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1rem",
        color: "var(--color-muted)",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: "1.1rem", margin: 0 }}>{message}</p>
    </div>
  );
}
