import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EvaluationForm } from "./EvaluationForm";
import type { Employee, Question } from "../../types";

const mockEmployee: Employee = {
  id: 8,
  name: "Henry",
  email: "henry@co.com",
  position_name: "Developer",
};

const mockQuestions: Question[] = [
  { id: 1, title: "Entrega de Resultados", weight: 25, order: 1 },
  { id: 2, title: "Execução e Qualidade", weight: 20, order: 2 },
  { id: 3, title: "Capacidade de Aprendizado", weight: 20, order: 3 },
  { id: 4, title: "Resolução de Problemas", weight: 15, order: 4 },
  { id: 5, title: "Colaboração e Liderança", weight: 10, order: 5 },
  { id: 6, title: "Visão Estratégica", weight: 10, order: 6 },
];

describe("EvaluationForm", () => {
  it("renders employee name and questions", () => {
    render(
      <EvaluationForm
        employee={mockEmployee}
        questions={mockQuestions}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText(/henry/i)).toBeInTheDocument();
    expect(
      screen.getByText("Entrega de Resultados"),
    ).toBeInTheDocument();
    expect(screen.getByText("Visão Estratégica")).toBeInTheDocument();
  });

  it("shows 0 de 6 questões respondidas initially", () => {
    render(
      <EvaluationForm
        employee={mockEmployee}
        questions={mockQuestions}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText(/0 de 6 questões respondidas/i)).toBeInTheDocument();
  });

  it("submit button is disabled initially", () => {
    render(
      <EvaluationForm
        employee={mockEmployee}
        questions={mockQuestions}
        onSubmit={vi.fn()}
      />,
    );
    const btn = screen.getByRole("button", { name: /enviar avaliação/i });
    expect(btn).toBeDisabled();
  });

  it("enables submit after all 6 scores entered", async () => {
    const onSubmit = vi.fn();
    render(
      <EvaluationForm
        employee={mockEmployee}
        questions={mockQuestions}
        onSubmit={onSubmit}
      />,
    );
    const user = userEvent.setup();
    const inputs = screen.getAllByRole("spinbutton");
    for (let i = 0; i < 6; i++) {
      await user.clear(inputs[i]);
      await user.type(inputs[i], "3");
    }
    const btn = screen.getByRole("button", { name: /enviar avaliação/i });
    expect(btn).not.toBeDisabled();
  });

  it("shows real-time weighted score preview", async () => {
    render(
      <EvaluationForm
        employee={mockEmployee}
        questions={mockQuestions}
        onSubmit={vi.fn()}
      />,
    );
    const user = userEvent.setup();
    const inputs = screen.getAllByRole("spinbutton");
    await user.clear(inputs[0]);
    await user.type(inputs[0], "4");
    // Q1: 4 * 25 / 100 = 1.00
    expect(screen.getByText(/nota parcial.*1\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/1 de 6 questões respondidas/i)).toBeInTheDocument();
  });

  it("validates score range 1-4", async () => {
    render(
      <EvaluationForm
        employee={mockEmployee}
        questions={mockQuestions}
        onSubmit={vi.fn()}
      />,
    );
    const user = userEvent.setup();
    const inputs = screen.getAllByRole("spinbutton");
    await user.clear(inputs[0]);
    await user.type(inputs[0], "5");
    expect(
      screen.getByText(/pontuação deve ser entre 1 e 4/i),
    ).toBeInTheDocument();
  });
});
