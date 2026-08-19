import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../../hooks/useAuth";
import { LeaderSelector } from "./LeaderSelector";
import * as api from "../../services/api";

vi.mock("../../services/api");

const mockEmployees = [
  { id: 1, name: "Alice Hartman", email: "alice@co.com", position_name: "CEO" },
  { id: 2, name: "Bob Smith", email: "bob@co.com", position_name: "CTO" },
];

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

function renderSelector() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LeaderSelector />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("LeaderSelector", () => {
  it("shows loading state initially", () => {
    vi.mocked(api.getEmployees).mockReturnValue(new Promise(() => {}));
    renderSelector();
    expect(screen.queryByText("Selecione sua identidade")).not.toBeInTheDocument();
  });

  it("renders employee dropdown after loading", async () => {
    vi.mocked(api.getEmployees).mockResolvedValue(mockEmployees);
    renderSelector();

    await waitFor(() => {
      expect(screen.getByText("Selecione sua identidade")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Alice Hartman — CEO"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Bob Smith — CTO"),
    ).toBeInTheDocument();
  });

  it("Entrar button is disabled when no selection", async () => {
    vi.mocked(api.getEmployees).mockResolvedValue(mockEmployees);
    renderSelector();

    await waitFor(() => {
      expect(screen.getByText("Selecione sua identidade")).toBeInTheDocument();
    });

    const button = screen.getByRole("button", { name: /entrar/i });
    expect(button).toBeDisabled();
  });

  it("selecting an employee enables Entrar button", async () => {
    vi.mocked(api.getEmployees).mockResolvedValue(mockEmployees);
    renderSelector();

    await waitFor(() => {
      expect(screen.getByText("Selecione sua identidade")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "1");

    const button = screen.getByRole("button", { name: /entrar/i });
    expect(button).not.toBeDisabled();
  });

  it("clicking Entrar sets employee_id in localStorage", async () => {
    vi.mocked(api.getEmployees).mockResolvedValue(mockEmployees);
    renderSelector();

    await waitFor(() => {
      expect(screen.getByText("Selecione sua identidade")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.selectOptions(screen.getByRole("combobox"), "1");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(localStorage.getItem("employee_id")).toBe("1");
  });
});
