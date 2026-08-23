import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../i18n/LanguageContext";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const { t } = useLanguage();
  const onCloseRef = useRef(onClose);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep onClose ref stable
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (type === "success") {
      const timer = setTimeout(() => {
        setVisible(false);
        closeTimerRef.current = setTimeout(() => onCloseRef.current(), 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [type]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  if (!visible) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: "1rem",
        right: "1rem",
        padding: "1rem 1.5rem",
        borderRadius: "6px",
        backgroundColor: type === "success" ? "var(--color-primary)" : "var(--color-danger)",
        color: "var(--color-background)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        zIndex: 2000,
        maxWidth: "400px",
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <span>{message}</span>
        {type === "error" && (
          <button
            onClick={() => {
              setVisible(false);
              closeTimerRef.current = setTimeout(() => onCloseRef.current(), 300);
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-background)",
              cursor: "pointer",
              fontSize: "1.2rem",
              padding: "0",
              lineHeight: 1,
            }}
          >
            {t('close')}
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
