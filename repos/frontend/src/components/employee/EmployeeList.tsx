import { useNavigate } from "react-router-dom";
import type { SubordinateEvaluation } from "../../types";

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

  if (evaluations.length === 0) {
    return null;
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
      <table>
        <thead>
          <tr>
            {["Funcionário", "Cargo", "Pontuação", "Data", "Ações"].map(
              (h) => (
                <th key={h}>{h}</th>
              ),
            )}
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
                        {e.depth === 1 ? 'Direto' : `Nível ${e.depth}`}
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
                      {e.latest_evaluation.total_score.toFixed(2)}
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
                          Avaliado
                        </span>
                      )}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-muted)' }}>
                      Não avaliado
                    </span>
                  )}
                </td>
                <td style={{ color: 'var(--color-muted)' }}>
                  {e.latest_evaluation
                    ? new Date(
                        e.latest_evaluation.evaluation_date,
                      ).toLocaleDateString("pt-BR", {
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
                      aria-label={`Avaliar ${e.employee_name}`}
                    >
                      Avaliar
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => navigate(`/history/${e.employee_id}`)}
                      aria-label={`Ver histórico de ${e.employee_name}`}
                    >
                      Histórico
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
