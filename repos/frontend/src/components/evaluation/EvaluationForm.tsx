import { useState } from "react";
import type { Employee, Question } from "../../types";
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
        Avaliar — {employee.name}
      </h2>
      <p style={{ color: "var(--color-muted)", marginBottom: "1.5rem" }}>
        {employee.position_name}
      </p>

      {error && (
        <div
          style={{
            padding: "0.75rem",
            backgroundColor: "#c0392b",
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
        {scoredCount} de 6 questões respondidas
        {scoredCount > 0 && (
          <span style={{ marginLeft: "1rem", color: "var(--color-primary)", fontWeight: 600 }}>
            Nota parcial: {weightedScore.toFixed(2)}
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
                  Peso: {q.weight}
                </span>
              </div>
              <input
                type="number"
                min={1}
                max={4}
                value={val !== undefined ? val : ""}
                onChange={(e) => handleScoreChange(q.id, e.target.value)}
                aria-label={`Nota para ${q.title}`}
                style={{
                  width: "80px",
                  padding: "0.5rem",
                  border: `1px solid ${hasError ? "#c0392b" : "var(--color-border)"}`,
                  borderRadius: "4px",
                  backgroundColor: "var(--color-background)",
                  color: "var(--color-primary)",
                  fontSize: "1rem",
                }}
              />
              {hasError && (
                <p style={{ color: "#c0392b", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                  Pontuação deve ser entre 1 e 4
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
          {isSubmitting ? "Enviando..." : "Enviar Avaliação"}
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
