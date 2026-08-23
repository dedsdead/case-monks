import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import * as api from "../src/services/api";

vi.mock("../src/services/api");

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  localStorage.clear();
  localStorage.setItem("employee_id", "1");
  vi.clearAllMocks();

  vi.mocked(api.getEmployee).mockResolvedValue({
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    position_name: "Developer",
  });
  vi.mocked(api.getQuestions).mockResolvedValue([
    { id: 1, title: "Entrega de Resultados", weight: 25, order: 1 },
  ]);
});

afterEach(() => {
  localStorage.clear();
});

describe("API Error Handling", () => {
  it("shows error message when API fails to load subordinates", async () => {
    vi.mocked(api.getSubordinateEvaluations).mockRejectedValue({
      response: { status: 500, data: { message: "Internal Server Error" } },
    });

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText("Erro ao carregar dados do funcionário")
      ).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /tentar novamente/i })).toBeInTheDocument();
  });

  it("allows user to retry after API failure", async () => {
    const user = userEvent.setup();
    vi.mocked(api.getSubordinateEvaluations)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce([
        {
          employee_id: 8,
          employee_name: "John Doe",
          position_name: "Developer",
          latest_evaluation: null,
          depth: 0,
        },
      ]);

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText("Erro ao carregar dados do funcionário")
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /tentar novamente/i }));

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    expect(api.getSubordinateEvaluations).toHaveBeenCalledTimes(2);
  });

  it("shows loading state while fetching data", async () => {
    vi.mocked(api.getSubordinateEvaluations).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve([]), 100)
        )
    );

    render(<App />);

    expect(screen.getByRole("status")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });
});
