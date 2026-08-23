import { useNavigate } from "react-router-dom";
import type { SubordinateEvaluation } from "../../types";
import { useLanguage, formatDate, formatScore } from "../../i18n/LanguageContext";

interface EmployeeListProps {
  evaluations: SubordinateEvaluation[];
}

function getCurrentIsoWeek(): { year: number; week: number } {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor(
    (now.getTime() - jan1.getTime()) / (24 * 60 * 60 * 1000),
  );
  const week = Math.ceil((days + jan1.getDay() + 1) / 7);
  return { year: now.getFullYear(), week };
}

function isEvaluatedThisWeek(
  eval_: SubordinateEvaluation["latest_evaluation"],
): boolean {
  if (!eval_) return false;
  const current = getCurrentIsoWeek();
  return (
    eval_.evaluation_year === current.year && eval_.week_number === current.week
  );
}

export function EmployeeList({ evaluations }: EmployeeListProps) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  if (evaluations.length === 0) {
    return null;
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              {[
                t('employee'),
                t('position'),
                t('score'),
                t('date'),
                t('actions'),
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {evaluations.map((e) => {
              const evaluated = isEvaluatedThisWeek(e.latest_evaluation);
              return (
                <tr
                  key={e.employee_id}
                  style={{
                    transition: "background-color 0.2s ease",
                    animation: "slideUp 0.3s ease-out",
                  }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                        {e.employee_name}
                      </span>
                      {e.depth > 0 && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-muted)',
                            padding: '0.2rem 0.5rem',
                            backgroundColor: 'var(--color-background)',
                            borderRadius: '4px',
                            fontWeight: 500,
                          }}
                        >
                          {e.depth === 1 ? t('direct') : t('level', { level: e.depth })}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-muted)' }}>
                    {e.position_name}
                  </td>
                  <td>
                    {e.latest_evaluation ? (
                      <span
                        style={{
                          fontWeight: 600,
                          color: 'var(--color-primary)',
                          fontSize: '1.1rem',
                        }}
                      >
                        {formatScore(e.latest_evaluation.total_score, language)}
                        {evaluated && (
                          <span
                            style={{
                              marginLeft: '0.5rem',
                              fontSize: '0.75rem',
                              backgroundColor: 'var(--color-primary)',
                              color: 'var(--color-background)',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '4px',
                              fontWeight: 600,
                            }}
                          >
                            {t('evaluatedBadge')}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-muted)' }}>
                        {t('notEvaluated')}
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'var(--color-muted)' }}>
                    {e.latest_evaluation
                      ? formatDate(e.latest_evaluation.evaluation_date, language, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : "—"}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate(`/evaluate/${e.employee_id}`)}
                        disabled={evaluated}
                        aria-label={t('evaluateEmployee', { name: e.employee_name })}
                      >
                        {t('evaluate')}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => navigate(`/history/${e.employee_id}`)}
                        aria-label={t('viewHistoryFor', { name: e.employee_name })}
                      >
                        {t('history')}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
