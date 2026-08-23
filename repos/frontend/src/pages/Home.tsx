import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { getSubordinateEvaluations } from "../services/api";
import { getResponseStatus } from "../lib/http";
import { useAuth } from "../hooks/useAuth";
import type { SubordinateEvaluation } from "../types";
import { EmployeeList } from "../components/employee/EmployeeList";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "../i18n/LanguageContext";

export function Home() {
  const [evaluations, setEvaluations] = useState<SubordinateEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { resetEmployee } = useAuth();
  const { t } = useLanguage();
  const refreshCtrlRef = useRef<AbortController | null>(null);

  const load = useCallback(
    (controller: AbortController) => {
      getSubordinateEvaluations(controller.signal)
        .then(setEvaluations)
        .catch((error) => {
          if (controller.signal.aborted) return;
          // AC-37: session expired/invalid — full identity reset so the
          // selector prompt replaces the app shell on the next render.
          if (getResponseStatus(error) === 401) {
            resetEmployee();
            return;
          }
          setError(t('loadDataError'));
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    },
    [resetEmployee, t]
  );

  useEffect(() => {
    const abortController = new AbortController();
    load(abortController);

    return () => {
      abortController.abort();
      refreshCtrlRef.current?.abort();
    };
  }, [load]);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    refreshCtrlRef.current?.abort();
    const abortController = new AbortController();
    refreshCtrlRef.current = abortController;
    load(abortController);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <p className="max-w-md text-lg text-muted-foreground">{error}</p>
      <Button variant="outline" onClick={handleRefresh}>
        <RefreshCw />
        {t('retry')}
      </Button>
    </div>
  );
  if (evaluations.length === 0)
    return <EmptyState message={t('noSubordinatesMessage')} />;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('subordinatesTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('subordinatesCount', { count: evaluations.length })}
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw />
          {t('refresh')}
        </Button>
      </div>
      <EmployeeList evaluations={evaluations} />
    </div>
  );
}
