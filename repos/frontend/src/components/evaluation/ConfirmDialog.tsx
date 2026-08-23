interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9998,
      }}
    >
      <div
        style={{
          backgroundColor: "var(--color-background)",
          borderRadius: "8px",
          padding: "1.5rem",
          maxWidth: "420px",
          width: "90%",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        }}
      >
        <p
          style={{
            color: "var(--color-primary)",
            fontSize: "1rem",
            marginBottom: "1.5rem",
            lineHeight: 1.5,
          }}
        >
          Confirmar envio da avaliação? Esta ação não pode ser desfeita.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "0.5rem 1.25rem",
              backgroundColor: "var(--color-border)",
              color: "var(--color-primary)",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "0.5rem 1.25rem",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-background)",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
