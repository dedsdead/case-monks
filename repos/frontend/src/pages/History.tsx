import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { getEmployee, getEvaluationHistory } from "../services/api";
import { getResponseStatus } from "../lib/http";
import type { Employee, EvaluationSummary } from "../types";
import { EvaluationHistory } from "../components/history/EvaluationHistory";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Toast } from "../components/ui/Toast";
import { Button } from "@/components/ui/button";
import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../hooks/useAuth";

export function History() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [history, setHistory] = useState<EvaluationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const refreshCtrlRef = useRef<AbortController | null>(null);
  const { resetEmployee } = useAuth();

  const loadHistory = useCallback(
    (controller: AbortController) => {
      if (!employeeId) return;
      const id = Number(employeeId);

      getEmployee(id, controller.signal)
        .then(emp => {
          if (controller.signal.aborted) return;
          setEmployee(emp);

          return getEvaluationHistory(id, controller.signal);
        })
        .then(hist => {
          if (controller.signal.aborted) return;
          if (hist) {
            setHistory(hist);
          }
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          const status = getResponseStatus(err);

          // AC-37: session expired/invalid — reset identity so the selector
          // prompt replaces the app shell.
          if (status === 401) {
            resetEmployee();
            return;
          }

          if (status === 403) {
            setToast({
              message: t('accessDeniedError'),
              type: "error",
            });
          } else if (status === 404) {
            setToast({
              message: t('employeeNotFoundError'),
              type: "error",
            });
          } else if (status !== undefined && status >= 500) {
            setToast({
              message: t('serverError'),
              type: "error",
            });
          } else {
            setToast({
              message: t('loadDataError'),
              type: "error",
            });
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    },
    [employeeId, t, resetEmployee]
  );

  useEffect(() => {
    if (!employeeId) return;
    const ctrl = new AbortController();
    loadHistory(ctrl);

    return () => {
      ctrl.abort();
      refreshCtrlRef.current?.abort();
    };
  }, [employeeId, loadHistory]);

  const handleGoBack = () => {
    navigate("/");
  };

  const handleRefresh = () => {
    setLoading(true);
    setToast(null);
    refreshCtrlRef.current?.abort();
    const ctrl = new AbortController();
    refreshCtrlRef.current = ctrl;
    loadHistory(ctrl);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleGoBack}>
            <ArrowLeft />
            {t('back')}
          </Button>
          <h2 className="truncate text-xl font-semibold tracking-tight">
            {employee
              ? t('historyTitle', { name: employee.name })
              : t('evaluationHistory')}
          </h2>
        </div>

        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw />
          {t('refresh')}
        </Button>
      </div>

      {history.length === 0 ? (
        <EmptyState message={t('noEvaluations')} />
      ) : (
        <EvaluationHistory
          history={history}
          employeeName={employee?.name ?? ""}
        />
      )}

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
