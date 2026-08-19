import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEmployee, getEvaluationHistory } from "../services/api";
import type { Employee, EvaluationSummary } from "../types";
import { EvaluationHistory } from "../components/history/EvaluationHistory";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Toast } from "../components/ui/Toast";

export function History() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [history, setHistory] = useState<EvaluationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!employeeId) return;
    const ctrl = new AbortController();

    Promise.all([
      getEmployee(Number(employeeId), ctrl.signal),
      getEvaluationHistory(Number(employeeId), ctrl.signal),
    ])
      .then(([emp, hist]) => {
        if (ctrl.signal.aborted) return;
        setEmployee(emp);
        setHistory(hist);
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        const status = err?.response?.status;
        if (status === 403) {
          setToast({
            message: "Você não tem acesso para visualizar este funcionário",
            type: "error",
          });
          timerRef.current = setTimeout(() => navigate("/"), 2000);
        } else {
          setToast({ message: "Funcionário não encontrado", type: "error" });
          timerRef.current = setTimeout(() => navigate("/"), 2000);
        }
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => {
      ctrl.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [employeeId, navigate]);

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <EvaluationHistory
        history={history}
        employeeName={employee?.name ?? ""}
      />
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
