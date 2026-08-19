import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmployeeList } from "./EmployeeList";
import type { SubordinateEvaluation } from "../../types";

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
    const { container } = render(<EmployeeList evaluations={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders table headers", () => {
    render(<EmployeeList evaluations={mockEvaluations} />);
    expect(screen.getByText("Funcionário")).toBeInTheDocument();
    expect(screen.getByText("Cargo")).toBeInTheDocument();
    expect(screen.getByText("Pontuação")).toBeInTheDocument();
    expect(screen.getByText("Data")).toBeInTheDocument();
    expect(screen.getByText("Ações")).toBeInTheDocument();
  });

  it("renders employee names and positions", () => {
    render(<EmployeeList evaluations={mockEvaluations} />);
    expect(screen.getByText("Henry")).toBeInTheDocument();
    expect(screen.getByText("Developer")).toBeInTheDocument();
    expect(screen.getByText("James")).toBeInTheDocument();
    expect(screen.getByText("Designer")).toBeInTheDocument();
  });

  it("renders score for evaluated employee", () => {
    render(<EmployeeList evaluations={mockEvaluations} />);
    expect(screen.getByText("3.40")).toBeInTheDocument();
  });

  it("renders 'Não avaliado' for unevaluated employee", () => {
    render(<EmployeeList evaluations={mockEvaluations} />);
    expect(screen.getByText("Não avaliado")).toBeInTheDocument();
  });

  it("renders evaluate and history links", () => {
    render(<EmployeeList evaluations={mockEvaluations} />);
    const evalLinks = screen.getAllByText("Avaliar");
    const histLinks = screen.getAllByText("Histórico");
    expect(evalLinks).toHaveLength(2);
    expect(histLinks).toHaveLength(2);
    expect(evalLinks[0].closest("a")).toHaveAttribute("href", "/evaluate/8");
    expect(histLinks[0].closest("a")).toHaveAttribute("href", "/history/8");
  });

  it("shows depth indicator for direct reports", () => {
    render(<EmployeeList evaluations={mockEvaluations} />);
    expect(screen.getByText("Direto")).toBeInTheDocument();
  });

  it("shows depth indicator for indirect reports", () => {
    render(<EmployeeList evaluations={mockEvaluations} />);
    expect(screen.getByText("Nível 2")).toBeInTheDocument();
  });
});
