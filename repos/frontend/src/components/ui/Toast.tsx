import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { cn } from "../../lib/utils";

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
      className={cn(
        "fixed top-4 right-4 z-[2000] flex max-w-sm items-center gap-3 rounded-lg px-5 py-4 text-white shadow-lg animate-slide-up",
        type === "success" ? "bg-success" : "bg-destructive"
      )}
    >
      <span className="text-sm font-medium">{message}</span>
      {type === "error" && (
        <button
          onClick={() => {
            setVisible(false);
            closeTimerRef.current = setTimeout(() => onCloseRef.current(), 300);
          }}
          aria-label={t('close')}
          className="min-h-0 rounded p-1 opacity-80 transition-opacity hover:opacity-100"
        >
          <X className="size-4" />
        </button>
      )}
    </div>,
    document.body,
  );
}
