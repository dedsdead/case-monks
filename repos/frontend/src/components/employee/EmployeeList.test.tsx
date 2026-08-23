import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { EmployeeList } from "./EmployeeList";
import { LanguageProvider } from "../../i18n/LanguageContext";
import type { SubordinateEvaluation } from "../../types";

function renderList(evaluations: SubordinateEvaluation[]) {
  return render(
    <BrowserRouter>
      <LanguageProvider>
        <EmployeeList evaluations={evaluations} />
      </LanguageProvider>
    </BrowserRouter>
  );
}

const mockEvaluations: SubordinateEvaluation[] = [
  {
    employee_id: 8,
    employee_name: "Henry",
    position_name: "Developer",
    latest_evaluation: {
      id: 1,
      employee_id: 8,
      evaluator_id: 4,
      total_score: 3.4,
      evaluation_date: "2026-08-17T20:00:00Z",
      evaluation_year: 2026,
      week_number: 33,
      questions: [],
    },
    depth: 1,
  },
  {
    employee_id: 10,
    employee_name: "James",
    position_name: "Designer",
    latest_evaluation: null,
    depth: 2,
  },
];

describe("EmployeeList", () => {
  it("renders null for empty evaluations", () => {
    const { container } = renderList([]);
    expect(container.innerHTML).toBe("");
  });

  it("renders table headers", () => {
    renderList(mockEvaluations);
    expect(screen.getByText("Funcionário")).toBeInTheDocument();
    expect(screen.getByText("Cargo")).toBeInTheDocument();
    expect(screen.getByText("Pontuação")).toBeInTheDocument();
    expect(screen.getByText("Data")).toBeInTheDocument();
    expect(screen.getByText("Ações")).toBeInTheDocument();
  });

  it("renders employee names and positions", () => {
    renderList(mockEvaluations);
    expect(screen.getByText("Henry")).toBeInTheDocument();
    expect(screen.getByText("Developer")).toBeInTheDocument();
    expect(screen.getByText("James")).toBeInTheDocument();
    expect(screen.getByText("Designer")).toBeInTheDocument();
  });

  it("renders score for evaluated employee", () => {
    renderList(mockEvaluations);
    // pt-BR locale formats decimals with comma
    expect(screen.getByText("3,40")).toBeInTheDocument();
  });

  it("renders 'Não avaliado' for unevaluated employee", () => {
    renderList(mockEvaluations);
    expect(screen.getByText("Não avaliado")).toBeInTheDocument();
  });

  it("renders evaluate and history buttons", () => {
    renderList(mockEvaluations);
    const evalButtons = screen.getAllByText("Avaliar");
    const histButtons = screen.getAllByText("Histórico");
    expect(evalButtons).toHaveLength(2);
    expect(histButtons).toHaveLength(2);
    expect(evalButtons[0]).toBeInTheDocument();
    expect(histButtons[0]).toBeInTheDocument();
  });

  it("shows depth indicator for direct reports", () => {
    renderList(mockEvaluations);
    expect(screen.getByText("Direto")).toBeInTheDocument();
  });

  it("shows depth indicator for indirect reports", () => {
    renderList(mockEvaluations);
    expect(screen.getByText("Nível 2")).toBeInTheDocument();
  });
});

