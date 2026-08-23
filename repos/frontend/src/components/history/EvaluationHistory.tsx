import { useState } from "react";
import type { EvaluationSummary } from "../../types";
import {
  useLanguage,
  formatDate,
  formatScore,
  type Language,
} from "../../i18n/LanguageContext";
import { EvaluationDetail } from "./EvaluationDetail";
import { EmptyState } from "../ui/EmptyState";

interface EvaluationHistoryProps {
  history: EvaluationSummary[];
  employeeName: string;
}

export function EvaluationHistory({ history, employeeName }: EvaluationHistoryProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { t, language } = useLanguage();

  if (history.length === 0) {
    return <EmptyState message={t('noEvaluations')} />;
  }

  return (
    <div>
      <h2 style={{ color: "var(--color-primary)", marginBottom: "0.5rem" }}>
        {t('history')} — {employeeName}
      </h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {[t('week'), t('year'), t('date'), t('score'), t('actions')].map((h) => (
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
                language={language}
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
  language,
  isExpanded,
  onToggle,
}: {
  evaluation: EvaluationSummary;
  language: Language;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useLanguage();

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
          {formatDate(evaluation.evaluation_date, language)}
        </td>
        <td style={{ padding: "0.75rem" }}>
          <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>
            {formatScore(evaluation.total_score, language)}
          </span>
        </td>
        <td style={{ padding: "0.75rem" }}>
          <button
            onClick={onToggle}
            aria-expanded={isExpanded}
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
            {isExpanded ? t('hideDetails') : t('details')}
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
