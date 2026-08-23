import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import * as api from "../src/services/api";

vi.mock("../src/services/api");

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  localStorage.clear();
  localStorage.setItem("employee_id", "1");
  vi.clearAllMocks();

  vi.mocked(api.getSubordinateEvaluations).mockResolvedValue([
    {
      employee_id: 8,
      employee_name: "John Doe",
      position_name: "Developer",
      latest_evaluation: null,
      depth: 0,
    },
  ]);
  vi.mocked(api.getEmployee).mockResolvedValue({
    id: 8,
    name: "John Doe",
    email: "john@example.com",
    position_name: "Developer",
  });
  vi.mocked(api.getQuestions).mockResolvedValue([
    { id: 1, title: "Entrega de Resultados", weight: 25, order: 1 },
  ]);
  vi.mocked(api.getEvaluationHistory).mockResolvedValue([]);
});

afterEach(() => {
  localStorage.clear();
});

describe("Collapsible Sidebar Navigation", () => {
  it("shows sidebar with app title and navigation menu", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Meus Subordinados")).toBeInTheDocument();
    });

    expect(screen.getByText("Avaliações")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("href", "/");
    expect(
      screen.getByRole("link", { name: "Histórico de Avaliações" })
    ).toHaveAttribute("href", "/history");
    expect(screen.getByRole("button", { name: /alternar menu/i })).toBeInTheDocument();
  });

  it("collapses and expands the sidebar", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Meus Subordinados")).toBeInTheDocument();
    });

    // Sidebar expanded by default on desktop: logo visible
    expect(screen.getByText("Avaliações")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /alternar menu/i }));

    // Collapsed: logo hidden
    expect(screen.queryByText("Avaliações")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /alternar menu/i }));

    // Expanded again: logo visible
    expect(screen.getByText("Avaliações")).toBeInTheDocument();
  });

  it("highlights the active navigation item", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Meus Subordinados")).toBeInTheDocument();
    });

    const homeLink = screen.getByRole("link", { name: "Início" });
    expect(homeLink.style.backgroundColor).toBe("var(--color-border)");

    const historyLink = screen.getByRole("link", { name: "Histórico de Avaliações" });
    expect(historyLink.style.backgroundColor).toBe("transparent");

    await user.click(historyLink);

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: "Histórico de Avaliações" }).style.backgroundColor
      ).toBe("var(--color-border)");
    });
    expect(
      screen.getByRole("link", { name: "Início" }).style.backgroundColor
    ).toBe("transparent");
  });

  it("shows hamburger menu instead of sidebar on mobile", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });

    try {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText("Meus Subordinados")).toBeInTheDocument();
      });

      // Mobile: sidebar collapsed, hamburger button shown
      expect(screen.queryByText("Avaliações")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /abrir menu/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /abrir menu/i }));
      expect(screen.getByText("Avaliações")).toBeInTheDocument();
    } finally {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });
    }
  });
});
