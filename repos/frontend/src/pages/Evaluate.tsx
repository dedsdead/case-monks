import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { getEmployee, getQuestions, submitEvaluation } from "../services/api";
import { getResponseStatus } from "../lib/http";
import type { Employee, Question } from "../types";
import { EvaluationForm } from "../components/evaluation/EvaluationForm";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Toast } from "../components/ui/Toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../hooks/useAuth";

export function Evaluate() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { resetEmployee } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the submit-path redirect timer on unmount (the load-path timer
  // is cleared by the fetch effect's own cleanup).
  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, []);

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
        const status = getResponseStatus(err);

        // AC-37: session expired/invalid — reset identity so the selector
        // prompt replaces the app shell.
        if (status === 401) {
          resetEmployee();
          return;
        }

        if (status === 404) {
          setToast({ message: t('employeeNotFoundError'), type: "error" });
          timerRef.current = setTimeout(() => navigate("/"), 2000);
        } else if (status === 403) {
          setToast({
            message: t('accessDeniedError'),
            type: "error",
          });
          timerRef.current = setTimeout(() => navigate("/"), 2000);
        } else if (status !== undefined && status >= 500) {
          setToast({
            message: t('serverError'),
            type: "error",
          });
        } else if (status !== undefined && status >= 400) {
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
    if (!employeeId || isSubmitting || isSubmitted) return;
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
      const status = getResponseStatus(err);
      if (status === 409) {
        setError(t('alreadyEvaluated'));
      } else if (status === 403) {
        setToast({
          message: t('accessDeniedError'),
          type: "error",
        });
        navTimerRef.current = setTimeout(() => navigate("/"), 2000);
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
          <div className="mb-6 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleGoBack}>
              <ArrowLeft />
              {t('back')}
            </Button>
            <h2 className="truncate text-xl font-semibold tracking-tight">
              {t('evaluateTitle', { name: employee.name })}
            </h2>
          </div>

          {isSubmitted && (
            <Card className="mb-6 border-success/30 bg-success/10 animate-slide-up">
              <CardContent className="flex flex-col items-center gap-5 text-center">
                <CheckCircle2 className="size-12 text-success" />
                <h3 className="text-lg font-semibold text-foreground">
                  {t('evaluationSubmitted')}
                </h3>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button variant="outline" onClick={handleGoBack}>
                    <ArrowLeft />
                    {t('back')}
                  </Button>
                  <Button onClick={handleViewHistory}>
                    {t('evaluationHistory')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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
        <div className="flex flex-col gap-4 py-8 text-muted-foreground">
          <p>{error}</p>
          <Button variant="ghost" size="sm" onClick={handleGoBack}>
            <ArrowLeft />
            {t('back')}
          </Button>
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
