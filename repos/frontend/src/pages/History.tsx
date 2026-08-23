import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEmployee, getEvaluationHistory } from "../services/api";
import type { Employee, EvaluationSummary } from "../types";
import { EvaluationHistory } from "../components/history/EvaluationHistory";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Toast } from "../components/ui/Toast";
import { useLanguage } from "../i18n/LanguageContext";

export function History() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [history, setHistory] = useState<EvaluationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!employeeId) return;
    const ctrl = new AbortController();

    getEmployee(Number(employeeId), ctrl.signal)
      .then(emp => {
        if (ctrl.signal.aborted) return;
        setEmployee(emp);

        return getEvaluationHistory(Number(employeeId), ctrl.signal);
      })
      .then(hist => {
        if (ctrl.signal.aborted) return;
        if (hist) {
          setHistory(hist);
        }
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        const status = err?.response?.status;

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
        } else if (status >= 500) {
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
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => {
      ctrl.abort();
    };
  }, [employeeId, navigate, t]);

  const handleGoBack = () => {
    navigate("/");
  };

  const handleRefresh = () => {
    setLoading(true);
    setToast(null);
    const ctrl = new AbortController();

    getEmployee(Number(employeeId), ctrl.signal)
      .then(emp => {
        if (ctrl.signal.aborted) return;
        setEmployee(emp);
        return getEvaluationHistory(Number(employeeId), ctrl.signal);
      })
      .then(hist => {
        if (ctrl.signal.aborted) return;
        if (hist) {
          setHistory(hist);
        }
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        const status = err?.response?.status;

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
        } else if (status >= 500) {
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
        if (!ctrl.signal.aborted) setLoading(false);
      });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          padding: "1rem",
          backgroundColor: "var(--color-background)",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <button onClick={handleGoBack} className="btn btn-secondary">
            ← {t('back')}
          </button>
          <h1 style={{ color: "var(--color-primary)", margin: 0, fontSize: "1.5rem" }}>
            {employee
              ? t('historyTitle', { name: employee.name })
              : t('evaluationHistory')}
          </h1>
        </div>

        <button onClick={handleRefresh} className="btn btn-secondary">
          ↻ {t('refresh')}
        </button>
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
