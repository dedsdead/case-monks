import { useState } from "react";
import type { EvaluationSummary } from "../../types";
import { EvaluationDetail } from "./EvaluationDetail";
import { EmptyState } from "../ui/EmptyState";

interface EvaluationHistoryProps {
  history: EvaluationSummary[];
  employeeName: string;
}

export function EvaluationHistory({ history, employeeName }: EvaluationHistoryProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (history.length === 0) {
    return (
      <EmptyState message="Nenhuma avaliação registrada para este funcionário" />
    );
  }

  return (
    <div>
      <h2 style={{ color: "var(--color-primary)", marginBottom: "0.5rem" }}>
        Histórico — {employeeName}
      </h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Semana", "Ano", "Data", "Nota", "Ações"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "0.75rem",
                    borderBottom: "2px solid var(--color-border)",
                    color: "var(--color-primary)",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((eval_) => (
              <EvaluationRow
                key={eval_.id}
                evaluation={eval_}
                isExpanded={expandedId === eval_.id}
                onToggle={() =>
                  setExpandedId(expandedId === eval_.id ? null : eval_.id)
                }
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EvaluationRow({
  evaluation,
  isExpanded,
  onToggle,
}: {
  evaluation: EvaluationSummary;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
        <td style={{ padding: "0.75rem", color: "var(--color-primary)" }}>
          {evaluation.week_number}
        </td>
        <td style={{ padding: "0.75rem", color: "var(--color-muted)" }}>
          {evaluation.evaluation_year}
        </td>
        <td style={{ padding: "0.75rem", color: "var(--color-muted)" }}>
          {new Date(evaluation.evaluation_date).toLocaleDateString("pt-BR")}
        </td>
        <td style={{ padding: "0.75rem" }}>
          <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>
            {evaluation.total_score.toFixed(2)}
          </span>
        </td>
        <td style={{ padding: "0.75rem" }}>
          <button
            onClick={onToggle}
            style={{
              padding: "0.35rem 0.75rem",
              backgroundColor: isExpanded
                ? "var(--color-primary)"
                : "var(--color-border)",
              color: isExpanded
                ? "var(--color-background)"
                : "var(--color-primary)",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            {isExpanded ? "Ocultar" : "Detalhes"}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5}>
            <EvaluationDetail summary={evaluation} />
          </td>
        </tr>
      )}
    </>
  );
}
