import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EvaluationHistory } from "./EvaluationHistory";
import type { EvaluationSummary } from "../../types";

const mockHistory: EvaluationSummary[] = [
  {
    id: 2,
    employee_id: 8,
    evaluator_id: 4,
    total_score: 3.6,
    evaluation_date: "2026-08-24T20:00:00Z",
    evaluation_year: 2026,
    week_number: 34,
    questions: [
      { question_id: 1, title: "Entrega de Resultados", weight: 25, score: 4 },
    ],
  },
  {
    id: 1,
    employee_id: 8,
    evaluator_id: 4,
    total_score: 3.4,
    evaluation_date: "2026-08-17T20:00:00Z",
    evaluation_year: 2026,
    week_number: 33,
    questions: [
      { question_id: 1, title: "Entrega de Resultados", weight: 25, score: 4 },
    ],
  },
];

describe("EvaluationHistory", () => {
  it("renders empty state when no history", () => {
    render(
      <EvaluationHistory history={[]} employeeName="Henry" />,
    );
    expect(
      screen.getByText(/nenhuma avaliação registrada/i),
    ).toBeInTheDocument();
  });

  it("renders evaluation rows", () => {
    render(
      <EvaluationHistory history={mockHistory} employeeName="Henry" />,
    );
    expect(screen.getByText("3.60")).toBeInTheDocument();
    expect(screen.getByText("3.40")).toBeInTheDocument();
  });

  it("renders week and year columns", () => {
    render(
      <EvaluationHistory history={mockHistory} employeeName="Henry" />,
    );
    expect(screen.getByText("34")).toBeInTheDocument();
    expect(screen.getByText("33")).toBeInTheDocument();
    expect(screen.getAllByText("2026").length).toBeGreaterThanOrEqual(1);
  });

  it("expands row to show detail on click", async () => {
    render(
      <EvaluationHistory history={mockHistory} employeeName="Henry" />,
    );
    const user = userEvent.setup();
    const expandButtons = screen.getAllByText(/detalhes/i);
    await user.click(expandButtons[0]);
    expect(screen.getByText("Entrega de Resultados")).toBeInTheDocument();
  });
});
