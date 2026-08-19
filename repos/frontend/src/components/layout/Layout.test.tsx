import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../../hooks/useAuth";
import { Layout } from "./Layout";

vi.mock("../../services/api", () => ({
  getEmployees: vi.fn().mockResolvedValue([]),
  getSubordinateEvaluations: vi.fn().mockResolvedValue([]),
}));

beforeEach(() => {
  localStorage.clear();
});

function renderWithAuth(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}

describe("Layout", () => {
  it("shows LeaderSelector when no employee_id in localStorage", async () => {
    renderWithAuth(<Layout />);
    await waitFor(() => {
      expect(
        screen.getByText("Selecione sua identidade"),
      ).toBeInTheDocument();
    });
  });

  it("shows header with app title when authenticated", () => {
    localStorage.setItem("employee_id", "1");
    renderWithAuth(<Layout />);
    expect(screen.getByText("Avaliação de Liderados")).toBeInTheDocument();
  });

  it("shows Trocar identidade button when authenticated", () => {
    localStorage.setItem("employee_id", "1");
    renderWithAuth(<Layout />);
    expect(
      screen.getByRole("button", { name: /trocar identidade/i }),
    ).toBeInTheDocument();
  });
});
