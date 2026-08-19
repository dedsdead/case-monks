import type { EvaluationSummary } from "../../types";

interface EvaluationDetailProps {
  summary: EvaluationSummary;
}

export function EvaluationDetail({ summary }: EvaluationDetailProps) {
  return (
    <div style={{ padding: "0.75rem" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Questão", "Peso", "Nota", "Contribuição"].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--color-border)",
                  color: "var(--color-muted)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {summary.questions.map((q) => (
            <tr key={q.question_id}>
              <td
                style={{
                  padding: "0.5rem",
                  color: "var(--color-primary)",
                  fontSize: "0.85rem",
                }}
              >
                {q.title}
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  color: "var(--color-muted)",
                  fontSize: "0.85rem",
                }}
              >
                {q.weight}
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  color: "var(--color-primary)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                }}
              >
                {q.score}
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  color: "var(--color-primary)",
                  fontSize: "0.85rem",
                }}
              >
                {((q.score * q.weight) / 100).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td
              colSpan={3}
              style={{
                padding: "0.5rem",
                fontWeight: 700,
                color: "var(--color-primary)",
                borderTop: "2px solid var(--color-border)",
                fontSize: "0.85rem",
              }}
            >
              Total
            </td>
            <td
              style={{
                padding: "0.5rem",
                fontWeight: 700,
                color: "var(--color-primary)",
                borderTop: "2px solid var(--color-border)",
                fontSize: "0.85rem",
              }}
            >
              {summary.total_score.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
