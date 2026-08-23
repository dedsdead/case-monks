import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import * as api from "../src/services/api";

vi.mock("../src/services/api");

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("employee_id", "4");
  vi.clearAllMocks();

  vi.mocked(api.getSubordinateEvaluations).mockResolvedValue([
    {
      employee_id: 1,
      employee_name: "John Doe",
      position_name: "Developer",
      latest_evaluation: null,
      depth: 0,
    },
  ]);
  vi.mocked(api.getEmployee).mockResolvedValue({
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    position_name: "Developer",
  });
  vi.mocked(api.getQuestions).mockResolvedValue([
    { id: 1, title: "Entrega de Resultados", weight: 25, order: 1 },
  ]);
  vi.mocked(api.getEvaluationHistory).mockResolvedValue([
    {
      id: 1,
      employee_id: 1,
      evaluator_id: 4,
      total_score: 3.5,
      evaluation_date: new Date().toISOString(),
      evaluation_year: new Date().getFullYear(),
      week_number: 33,
      questions: [],
    },
  ]);
});

afterEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});

describe("Evaluation History Functionality", () => {
  it("displays evaluation history for an employee", async () => {
    window.history.replaceState({}, "", "/history/1");
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Histórico de John Doe")).toBeInTheDocument();
    });

    // pt-BR locale formats decimals with comma
    expect(screen.getByText("3,50")).toBeInTheDocument();
    expect(screen.getByText(new Date().getFullYear().toString())).toBeInTheDocument();
    expect(screen.getByText(/voltar/i)).toBeInTheDocument();
  });

  it("shows empty state when no evaluation history exists", async () => {
    vi.mocked(api.getEvaluationHistory).mockResolvedValue([]);
    window.history.replaceState({}, "", "/history/1");
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Histórico de John Doe")).toBeInTheDocument();
    });
    expect(
      screen.getByText(/nenhuma avaliação registrada/i)
    ).toBeInTheDocument();
  });

  it("navigates back to home from history page", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/history/1");
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Histórico de John Doe")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /voltar/i }));

    await waitFor(() => {
      expect(screen.getByText("Meus Subordinados")).toBeInTheDocument();
    });
  });

  it("shows global history from sidebar navigation", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Meus Subordinados")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("link", { name: "Histórico de Avaliações" })
    );

    await waitFor(() => {
      expect(screen.getByText(/funcionário\(s\) avaliados/i)).toBeInTheDocument();
    });
  });
});
