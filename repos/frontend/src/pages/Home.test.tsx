import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../hooks/useAuth";
import { Home } from "./Home";
import * as api from "../services/api";

vi.mock("../services/api");

beforeEach(() => {
  localStorage.setItem("employee_id", "1");
  vi.clearAllMocks();
});

function renderHome() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Home />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("Home", () => {
  it("shows loading spinner initially", () => {
    vi.mocked(api.getSubordinateEvaluations).mockReturnValue(
      new Promise(() => {}),
    );
    renderHome();
    expect(screen.queryByText("Meus Subordinados")).not.toBeInTheDocument();
  });

  it("renders subordinate list after loading", async () => {
    vi.mocked(api.getSubordinateEvaluations).mockResolvedValue([
      {
        employee_id: 8,
        employee_name: "Henry",
        position_name: "Developer",
        latest_evaluation: null,
        depth: 1,
      },
    ]);
    renderHome();

    await waitFor(() => {
      expect(screen.getByText("Meus Subordinados")).toBeInTheDocument();
    });

    expect(screen.getByText("Henry")).toBeInTheDocument();
    expect(screen.getByText("1 funcionário(s) na sua hierarquia")).toBeInTheDocument();
  });

  it("shows empty state when no subordinates", async () => {
    vi.mocked(api.getSubordinateEvaluations).mockResolvedValue([]);
    renderHome();

    await waitFor(() => {
      expect(
        screen.getByText("Você não possui subordinados para avaliar."),
      ).toBeInTheDocument();
    });
  });

  it("shows error state on API failure", async () => {
    vi.mocked(api.getSubordinateEvaluations).mockRejectedValue(
      new Error("Network"),
    );
    renderHome();

    await waitFor(() => {
      expect(
        screen.getByText("Erro ao carregar subordinados."),
      ).toBeInTheDocument();
    });
  });
});
