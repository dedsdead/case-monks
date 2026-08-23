import { Loader2 } from "lucide-react";
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
      className="flex items-center justify-center p-8"
    >
      <Loader2
        className="animate-spin text-primary"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
