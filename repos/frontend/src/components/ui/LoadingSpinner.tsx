import { useLanguage } from "../../i18n/LanguageContext";

interface LoadingSpinnerProps {
  size?: number;
}

export function LoadingSpinner({ size = 32 }: LoadingSpinnerProps) {
  const { t } = useLanguage();

  return (
    <div
      role="status"
      aria-label={t('loading')}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          border: "3px solid var(--color-border)",
          borderTopColor: "var(--color-primary)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
