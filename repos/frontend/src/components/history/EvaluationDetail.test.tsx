import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EvaluationDetail } from "./EvaluationDetail";
import type { EvaluationSummary } from "../../types";

const mockSummary: EvaluationSummary = {
  id: 1,
  employee_id: 8,
  evaluator_id: 4,
  total_score: 3.4,
  evaluation_date: "2026-08-17T20:00:00Z",
  evaluation_year: 2026,
  week_number: 33,
  questions: [
    { question_id: 1, title: "Entrega de Resultados", weight: 25, score: 4 },
    { question_id: 2, title: "Execução e Qualidade", weight: 20, score: 3 },
    { question_id: 3, title: "Capacidade de Aprendizado", weight: 20, score: 4 },
    { question_id: 4, title: "Resolução de Problemas", weight: 15, score: 2 },
    { question_id: 5, title: "Colaboração e Liderança", weight: 10, score: 3 },
    { question_id: 6, title: "Visão Estratégica", weight: 10, score: 4 },
  ],
};

describe("EvaluationDetail", () => {
  it("renders all question titles", () => {
    render(<EvaluationDetail summary={mockSummary} />);
    expect(screen.getByText("Entrega de Resultados")).toBeInTheDocument();
    expect(screen.getByText("Execução e Qualidade")).toBeInTheDocument();
    expect(screen.getByText("Capacidade de Aprendizado")).toBeInTheDocument();
    expect(screen.getByText("Resolução de Problemas")).toBeInTheDocument();
    expect(screen.getByText("Colaboração e Liderança")).toBeInTheDocument();
    expect(screen.getByText("Visão Estratégica")).toBeInTheDocument();
  });

  it("renders scores using getAllByText for duplicates", () => {
    render(<EvaluationDetail summary={mockSummary} />);
    expect(screen.getAllByText("4")).toHaveLength(3);
    expect(screen.getAllByText("3")).toHaveLength(2);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders weights using getAllByText for duplicates", () => {
    render(<EvaluationDetail summary={mockSummary} />);
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getAllByText("20")).toHaveLength(2);
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getAllByText("10")).toHaveLength(2);
  });

  it("renders weighted contributions", () => {
    render(<EvaluationDetail summary={mockSummary} />);
    expect(screen.getByText("1.00")).toBeInTheDocument();
    expect(screen.getByText("0.60")).toBeInTheDocument();
    expect(screen.getByText("0.80")).toBeInTheDocument();
    expect(screen.getAllByText("0.30")).toHaveLength(2);
    expect(screen.getByText("0.40")).toBeInTheDocument();
  });

  it("renders total score", () => {
    render(<EvaluationDetail summary={mockSummary} />);
    expect(screen.getByText("3.40")).toBeInTheDocument();
  });
});
