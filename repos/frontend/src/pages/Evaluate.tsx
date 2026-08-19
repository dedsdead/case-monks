import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEmployee, getQuestions, submitEvaluation } from "../services/api";
import type { Employee, Question } from "../types";
import { EvaluationForm } from "../components/evaluation/EvaluationForm";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Toast } from "../components/ui/Toast";

export function Evaluate() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!employeeId) return;
    const ctrl = new AbortController();

    Promise.all([
      getEmployee(Number(employeeId), ctrl.signal),
      getQuestions(ctrl.signal),
    ])
      .then(([emp, qs]) => {
        if (ctrl.signal.aborted) return;
        setEmployee(emp);
        setQuestions(qs);
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        const status = err?.response?.status;
        if (status === 404) {
          setToast({ message: "Funcionário não encontrado", type: "error" });
          timerRef.current = setTimeout(() => navigate("/"), 2000);
        } else if (status === 403) {
          setToast({
            message: "Você não tem acesso para avaliar este funcionário",
            type: "error",
          });
          timerRef.current = setTimeout(() => navigate("/"), 2000);
        } else {
          setError("Erro ao carregar dados.");
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

  const handleSubmit = async (scores: Record<number, number>) => {
    if (!employeeId) return;
    setIsSubmitting(true);
    try {
      await submitEvaluation({
        employee_id: Number(employeeId),
        scores: Object.entries(scores).map(([qid, score]) => ({
          question_id: Number(qid),
          score,
        })),
      });
      setToast({ message: "Avaliação enviada com sucesso!", type: "success" });
      timerRef.current = setTimeout(() => navigate("/"), 1500);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setError("Você já avaliou esta semana.");
      } else if (status === 403) {
        setToast({
          message: "Você não tem acesso para avaliar este funcionário",
          type: "error",
        });
        timerRef.current = setTimeout(() => navigate("/"), 2000);
      } else {
        setError("Erro ao enviar avaliação. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      {employee && questions.length > 0 ? (
        <EvaluationForm
          employee={employee}
          questions={questions}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          error={error}
        />
      ) : error ? (
        <div style={{ padding: "2rem", color: "var(--color-muted)" }}>{error}</div>
      ) : null}
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
