import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { getSubordinateEvaluations } from "../services/api";
import { getResponseStatus } from "../lib/http";
import { useAuth } from "../hooks/useAuth";
import type { SubordinateEvaluation } from "../types";
import { EvaluationHistory } from "../components/history/EvaluationHistory";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Toast } from "../components/ui/Toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useLanguage } from "../i18n/LanguageContext";

export function GlobalHistory() {
  const [evaluations, setEvaluations] = useState<SubordinateEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const { resetEmployee } = useAuth();
  const { t } = useLanguage();
  const refreshCtrlRef = useRef<AbortController | null>(null);

  const load = useCallback(
    (controller: AbortController) => {
      getSubordinateEvaluations(controller.signal)
        .then(setEvaluations)
        .catch((error) => {
          if (controller.signal.aborted) return;
          // AC-37: session expired/invalid — reset identity so the selector
          // prompt replaces the app shell.
          if (getResponseStatus(error) === 401) {
            resetEmployee();
            return;
          }
          setToast({
            message: t('loadDataError'),
            type: "error",
          });
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    },
    [t, resetEmployee]
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
    setToast(null);
    refreshCtrlRef.current?.abort();
    const abortController = new AbortController();
    refreshCtrlRef.current = abortController;
    load(abortController);
  };

  if (loading) return <LoadingSpinner />;
  if (evaluations.length === 0)
    return <EmptyState message={t('noRegisteredEvaluations')} />;

  // Group evaluations by employee
  const employeeHistories = evaluations.map(emp => ({
    employee: {
      id: emp.employee_id,
      name: emp.employee_name,
      email: "",
      position_name: emp.position_name,
    },
    evaluations: emp.latest_evaluation ? [emp.latest_evaluation] : [],
  }));

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t('evaluationHistory')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('evaluatedEmployeesCount', { count: evaluations.length })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw />
          {t('refresh')}
        </Button>
      </div>

      <div className="flex flex-col gap-8">
        {employeeHistories.map((employeeHistory) => (
          <Card key={employeeHistory.employee.id} className="gap-0 py-0">
            <CardContent className="p-4 md:p-6">
              <h3 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
                {employeeHistory.employee.name}
              </h3>
              <EvaluationHistory
                history={employeeHistory.evaluations}
                employeeName={employeeHistory.employee.name}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
