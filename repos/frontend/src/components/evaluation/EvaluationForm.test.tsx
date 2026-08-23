import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EvaluationForm } from "./EvaluationForm";
import { LanguageProvider } from "../../i18n/LanguageContext";
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

function renderForm(onSubmit = vi.fn()) {
  return render(
    <LanguageProvider>
      <EvaluationForm
        employee={mockEmployee}
        questions={mockQuestions}
        onSubmit={onSubmit}
      />
    </LanguageProvider>,
  );
}

describe("EvaluationForm", () => {
  it("renders employee name and questions", () => {
    renderForm();
    expect(screen.getAllByText(/henry/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText("Entrega de Resultados"),
    ).toBeInTheDocument();
    expect(screen.getByText("Visão Estratégica")).toBeInTheDocument();
  });

  it("shows 0 de 6 questões respondidas initially", () => {
    renderForm();
    expect(screen.getByText(/0 de 6 questões respondidas/i)).toBeInTheDocument();
  });

  it("submit button is disabled initially", () => {
    renderForm();
    const btn = screen.getByRole("button", { name: /enviar avaliação/i });
    expect(btn).toBeDisabled();
  });

  it("enables submit after all 6 scores entered", async () => {
    const onSubmit = vi.fn();
    renderForm(onSubmit);
    const user = userEvent.setup();
    const inputs = screen.getAllByRole("spinbutton");
    for (let i = 0; i < 6; i++) {
      await user.clear(inputs[i]);
      await user.type(inputs[i], "3");
    }
    const btn = screen.getByRole("button", { name: /enviar avaliação/i });
    expect(btn).not.toBeDisabled();
  });

  it("submits evaluation after confirmation when all scores are valid", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm(onSubmit);
    const user = userEvent.setup();
    const inputs = screen.getAllByRole("spinbutton");
    for (let i = 0; i < 6; i++) {
      await user.clear(inputs[i]);
      await user.type(inputs[i], "3");
    }
    await user.click(screen.getByRole("button", { name: /enviar avaliação/i }));

    // Confirmation dialog appears before actual submission
    expect(screen.getByText(/confirmar envio da avaliação/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows real-time weighted score preview", async () => {
    renderForm();
    const user = userEvent.setup();
    const inputs = screen.getAllByRole("spinbutton");
    await user.clear(inputs[0]);
    await user.type(inputs[0], "4");
    // Q1: 4 * 25 / 100 = 1.00
    expect(screen.getByText(/nota parcial.*1[.,]00/i)).toBeInTheDocument();
    expect(screen.getByText(/1 de 6 questões respondidas/i)).toBeInTheDocument();
  });

  it("validates score range 1-4", async () => {
    renderForm();
    const user = userEvent.setup();
    const inputs = screen.getAllByRole("spinbutton");
    await user.clear(inputs[0]);
    await user.type(inputs[0], "5");
    expect(
      screen.getByText(/pontuação deve ser entre 1 e 4/i),
    ).toBeInTheDocument();
  });
});
