import type { EvaluationSummary } from "../../types";
import { useLanguage, formatScore } from "../../i18n/LanguageContext";

interface EvaluationDetailProps {
  summary: EvaluationSummary;
}

export function EvaluationDetail({ summary }: EvaluationDetailProps) {
  const { t, language } = useLanguage();

  return (
    <div style={{ padding: "0.75rem" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {[t('question'), t('weight'), t('score'), t('contribution')].map((h) => (
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
                {formatScore((q.score * q.weight) / 100, language)}
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
              {t('total')}
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
              {formatScore(summary.total_score, language)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
