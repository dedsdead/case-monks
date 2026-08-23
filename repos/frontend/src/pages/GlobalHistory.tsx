import { useEffect, useState } from "react";
import { getSubordinateEvaluations } from "../services/api";
import type { SubordinateEvaluation } from "../types";
import { EvaluationHistory } from "../components/history/EvaluationHistory";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Toast } from "../components/ui/Toast";
import { useLanguage } from "../i18n/LanguageContext";

export function GlobalHistory() {
  const [evaluations, setEvaluations] = useState<SubordinateEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const abortController = new AbortController();
    
    getSubordinateEvaluations(abortController.signal)
      .then(setEvaluations)
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setToast({
            message: t('loadDataError'),
            type: "error",
          });
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });
    
    return () => {
      abortController.abort();
    };
  }, [t]);

  const handleRefresh = () => {
    setLoading(true);
    setToast(null);
    const abortController = new AbortController();
    
    getSubordinateEvaluations(abortController.signal)
      .then(setEvaluations)
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setToast({
            message: t('loadDataError'),
            type: "error",
          });
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });
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
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h1 style={{ color: "var(--color-primary)", marginBottom: "0.5rem" }}>
            {t('evaluationHistory')}
          </h1>
          <p style={{ color: "var(--color-muted)" }}>
            {t('evaluatedEmployeesCount', { count: evaluations.length })}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          style={{
            padding: "0.4rem 0.8rem",
            backgroundColor: "var(--color-border)",
            color: "var(--color-primary)",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          ↻ {t('refresh')}
        </button>
      </div>

      {employeeHistories.map((employeeHistory) => (
        <div key={employeeHistory.employee.id} style={{ marginBottom: "2rem" }}>
          <h2 style={{ color: "var(--color-primary)", marginBottom: "1rem" }}>
            {employeeHistory.employee.name}
          </h2>
          <EvaluationHistory
            history={employeeHistory.evaluations}
            employeeName={employeeHistory.employee.name}
          />
        </div>
      ))}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}