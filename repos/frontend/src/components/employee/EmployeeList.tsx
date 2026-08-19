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
  if (evaluations.length === 0) {
    return null;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "1rem",
        }}
      >
        <thead>
          <tr>
            {["Funcionário", "Cargo", "Pontuação", "Data", "Ações"].map(
              (h) => (
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
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <td style={{ padding: "0.75rem", color: "var(--color-primary)" }}>
                  {e.employee_name}
                  {e.depth > 0 && (
                    <span
                      style={{
                        marginLeft: "0.5rem",
                        fontSize: "0.75rem",
                        color: "var(--color-muted)",
                      }}
                    >
                      {e.depth === 1 ? "Direto" : `Nível ${e.depth}`}
                    </span>
                  )}
                </td>
                <td
                  style={{
                    padding: "0.75rem",
                    color: "var(--color-muted)",
                  }}
                >
                  {e.position_name}
                </td>
                <td style={{ padding: "0.75rem" }}>
                  {e.latest_evaluation ? (
                    <span
                      style={{
                        fontWeight: 600,
                        color: "var(--color-primary)",
                      }}
                    >
                      {e.latest_evaluation.total_score.toFixed(2)}
                      {evaluated && (
                        <span
                          style={{
                            marginLeft: "0.5rem",
                            fontSize: "0.75rem",
                            backgroundColor: "var(--color-muted)",
                            color: "var(--color-background)",
                            padding: "0.15rem 0.4rem",
                            borderRadius: "3px",
                          }}
                        >
                          Avaliado
                        </span>
                      )}
                    </span>
                  ) : (
                    <span style={{ color: "var(--color-muted)" }}>
                      Não avaliado
                    </span>
                  )}
                </td>
                <td
                  style={{
                    padding: "0.75rem",
                    color: "var(--color-muted)",
                    fontSize: "0.9rem",
                  }}
                >
                  {e.latest_evaluation
                    ? new Date(
                        e.latest_evaluation.evaluation_date,
                      ).toLocaleDateString("pt-BR")
                    : "—"}
                </td>
                <td style={{ padding: "0.75rem", whiteSpace: "nowrap" }}>
                  <a
                    href={`/evaluate/${e.employee_id}`}
                    style={{
                      display: "inline-block",
                      padding: "0.4rem 0.8rem",
                      backgroundColor: evaluated
                        ? "var(--color-border)"
                        : "var(--color-primary)",
                      color: "var(--color-background)",
                      border: "none",
                      borderRadius: "4px",
                      cursor: evaluated ? "not-allowed" : "pointer",
                      fontSize: "0.85rem",
                      textDecoration: "none",
                      marginRight: "0.5rem",
                      opacity: evaluated ? 0.6 : 1,
                      pointerEvents: evaluated ? "none" : "auto",
                    }}
                  >
                    Avaliar
                  </a>
                  <a
                    href={`/history/${e.employee_id}`}
                    style={{
                      display: "inline-block",
                      padding: "0.4rem 0.8rem",
                      backgroundColor: "var(--color-border)",
                      color: "var(--color-primary)",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "0.85rem",
                      textDecoration: "none",
                    }}
                  >
                    Histórico
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
