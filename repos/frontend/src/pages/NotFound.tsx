import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { Button } from "@/components/ui/button";

export function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Compass className="size-10" />
      </span>
      <h1 className="text-4xl font-bold tracking-tight text-foreground">
        {t('pageNotFound')}
      </h1>
      <Button asChild variant="outline" size="lg">
        <Link to="/">{t('backToHome')}</Link>
      </Button>
    </div>
  );
}
