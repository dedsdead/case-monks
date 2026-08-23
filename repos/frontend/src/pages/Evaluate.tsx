import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEmployee, getQuestions, submitEvaluation } from "../services/api";
import type { Employee, Question } from "../types";
import { EvaluationForm } from "../components/evaluation/EvaluationForm";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Toast } from "../components/ui/Toast";
import { useLanguage } from "../i18n/LanguageContext";

export function Evaluate() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!employeeId) return;
    const ctrl = new AbortController();

    // Fetch employee first
    getEmployee(Number(employeeId), ctrl.signal)
      .then(emp => {
        if (ctrl.signal.aborted) return;
        setEmployee(emp);
        
        // Then fetch questions
        return getQuestions(ctrl.signal);
      })
      .then(qs => {
        if (ctrl.signal.aborted) return;
        if (qs) {
          setQuestions(qs);
        }
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        const status = err?.response?.status;
        
        if (status === 404) {
          setToast({ message: t('employeeNotFoundError'), type: "error" });
          timerRef.current = setTimeout(() => navigate("/"), 2000);
        } else if (status === 403) {
          setToast({
            message: t('accessDeniedError'),
            type: "error",
          });
          timerRef.current = setTimeout(() => navigate("/"), 2000);
        } else if (status === 500) {
          setToast({
            message: t('serverError'),
            type: "error",
          });
        } else if (status >= 400) {
          setToast({
            message: t('unknownError'),
            type: "error",
          });
        } else {
          // Network error or timeout
          setToast({
            message: t('connectionFailed'),
            type: "error",
          });
        }
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => {
      ctrl.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [employeeId, navigate, t]);

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
      setToast({ message: t('evaluationSubmitted'), type: "success" });
      setIsSubmitted(true);
      // Don't auto-redirect - let user decide what to do next
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setError(t('alreadyEvaluated'));
      } else if (status === 403) {
        setToast({
          message: t('accessDeniedError'),
          type: "error",
        });
        timerRef.current = setTimeout(() => navigate("/"), 2000);
      } else {
        setError(t('evaluationError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate("/");
  };

  const handleViewHistory = () => {
    navigate(`/history/${employeeId}`);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      {employee && questions.length > 0 ? (
        <>
          {/* Navigation Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "1rem",
              gap: "1rem",
            }}
          >
            <button
              onClick={handleGoBack}
              style={{
                padding: "0.4rem 0.8rem",
                backgroundColor: "var(--color-border)",
                color: "var(--color-primary)",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.85rem",
                textDecoration: "none",
              }}
            >
              ← {t('back')}
            </button>
            <h1 style={{ color: "var(--color-primary)", margin: 0 }}>
              {t('evaluateTitle', { name: employee.name })}
            </h1>
          </div>

          {/* Success State */}
          {isSubmitted && (
            <div
              style={{
                padding: "2rem",
                backgroundColor: "var(--color-success)",
                color: "var(--color-background)",
                borderRadius: "8px",
                marginBottom: "1rem",
                textAlign: "center",
              }}
            >
              <h2 style={{ margin: "0 0 1rem 0" }}>{t('evaluationSubmitted')}</h2>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "center",
                  marginTop: "1rem",
                }}
              >
                <button
                  onClick={handleGoBack}
                  style={{
                    padding: "0.6rem 1.2rem",
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-background)",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  {t('back')}
                </button>
                <button
                  onClick={handleViewHistory}
                  style={{
                    padding: "0.6rem 1.2rem",
                    backgroundColor: "var(--color-border)",
                    color: "var(--color-primary)",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  {t('evaluationHistory')}
                </button>
              </div>
            </div>
          )}

          {/* Evaluation Form */}
          {!isSubmitted && (
            <EvaluationForm
              employee={employee}
              questions={questions}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              error={error}
            />
          )}
        </>
      ) : error ? (
        <div style={{ padding: "2rem", color: "var(--color-muted)" }}>
          {error}
          <div style={{ marginTop: "1rem" }}>
            <button
              onClick={handleGoBack}
              style={{
                padding: "0.4rem 0.8rem",
                backgroundColor: "var(--color-primary)",
                color: "var(--color-background)",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              ← {t('back')}
            </button>
          </div>
        </div>
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
