import { useState } from "react";
import type { Employee, Question } from "../../types";
import { useLanguage, formatScore } from "../../i18n/LanguageContext";
import { ConfirmDialog } from "./ConfirmDialog";

interface EvaluationFormProps {
  employee: Employee;
  questions: Question[];
  onSubmit: (scores: Record<number, number>) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export function EvaluationForm({
  employee,
  questions,
  onSubmit,
  isSubmitting = false,
  error,
}: EvaluationFormProps) {
  const { t, language } = useLanguage();
  const [scores, setScores] = useState<Record<number, number>>({});
  const [showConfirm, setShowConfirm] = useState(false);

  const scoredCount = Object.keys(scores).length;
  const allValid = scoredCount === 6 && Object.values(scores).every((s) => s >= 1 && s <= 4);

  const weightedScore = questions.reduce((sum, q) => {
    const score = scores[q.id];
    return score ? sum + (score * q.weight) / 100 : sum;
  }, 0);

  const handleScoreChange = (questionId: number, value: string) => {
    const num = value === "" ? NaN : Number(value);
    setScores((prev) => {
      const next = { ...prev };
      if (isNaN(num)) {
        delete next[questionId];
      } else {
        next[questionId] = num;
      }
      return next;
    });
  };

  const handleSubmit = () => {
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onSubmit(scores);
  };

  return (
    <div>
      <h2 style={{ color: "var(--color-primary)", marginBottom: "0.25rem" }}>
        {t('evaluate')} — {employee.name}
      </h2>
      <p style={{ color: "var(--color-muted)", marginBottom: "1.5rem" }}>
        {employee.position_name}
      </p>

      {error && (
        <div
          role="alert"
          style={{
            padding: "0.75rem",
            backgroundColor: "var(--color-danger)",
            color: "var(--color-background)",
            borderRadius: "4px",
            marginBottom: "1rem",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginBottom: "1rem", color: "var(--color-muted)", fontSize: "0.9rem" }}>
        {scoredCount} {t('questionsAnswered')}
        {scoredCount > 0 && (
          <span style={{ marginLeft: "1rem", color: "var(--color-primary)", fontWeight: 600 }}>
            {t('partialScore')}: {formatScore(weightedScore, language)}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {questions.map((q) => {
          const val = scores[q.id];
          const hasError = val !== undefined && (val < 1 || val > 4);
          return (
            <div
              key={q.id}
              style={{
                padding: "1rem",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                backgroundColor: "var(--color-background)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                  {q.title}
                </span>
                <span style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>
                  {t('weight')}: {q.weight}
                </span>
              </div>
              <input
                type="number"
                min={1}
                max={4}
                value={val !== undefined ? val : ""}
                onChange={(e) => handleScoreChange(q.id, e.target.value)}
                aria-label={`${t('score')} ${q.title}`}
                aria-invalid={hasError || undefined}
                aria-describedby={hasError ? `score-error-${q.id}` : undefined}
                style={{
                  width: "80px",
                  padding: "0.5rem",
                  border: `1px solid ${hasError ? "var(--color-danger)" : "var(--color-border)"}`,
                  borderRadius: "4px",
                  backgroundColor: "var(--color-background)",
                  color: "var(--color-primary)",
                  fontSize: "1rem",
                }}
              />
              {hasError && (
                <p
                  id={`score-error-${q.id}`}
                  style={{ color: "var(--color-danger)", fontSize: "0.8rem", marginTop: "0.25rem" }}
                >
                  {t('scoreRange')}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <button
          onClick={handleSubmit}
          disabled={!allValid || isSubmitting}
          style={{
            padding: "0.75rem 2rem",
            backgroundColor: allValid && !isSubmitting
              ? "var(--color-primary)"
              : "var(--color-border)",
            color: "var(--color-background)",
            border: "none",
            borderRadius: "4px",
            cursor: allValid && !isSubmitting ? "pointer" : "not-allowed",
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          {isSubmitting ? `${t('evaluating')}...` : t('submitEvaluation')}
        </button>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
