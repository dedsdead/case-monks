import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import * as api from "../src/services/api";

vi.mock("../src/services/api");

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: 1024,
  });
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
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: 1024,
  });
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
    expect(
      screen.getByRole("button", { name: /alternar menu/i })
    ).toBeInTheDocument();
  });

  it("collapses and expands the sidebar keeping footer controls accessible", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Meus Subordinados")).toBeInTheDocument();
    });

    // Sidebar expanded by default on desktop: brand title visible
    expect(screen.getByText("Avaliações")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /alternar menu/i }));

    // Collapsed: brand title removed from DOM
    await waitFor(() => {
      expect(screen.queryByText("Avaliações")).not.toBeInTheDocument();
    });

    // Footer controls remain reachable while collapsed
    expect(
      screen.getByRole("button", { name: /trocar líder/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /idioma/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /alternar menu/i }));

    // Expanded again: brand title visible
    await waitFor(() => {
      expect(screen.getByText("Avaliações")).toBeInTheDocument();
    });
  });

  it("highlights the active navigation item", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Meus Subordinados")).toBeInTheDocument();
    });

    const homeLink = screen.getByRole("link", { name: "Início" });
    expect(homeLink).toHaveAttribute("data-active", "true");

    const historyLink = screen.getByRole("link", { name: "Histórico de Avaliações" });
    expect(historyLink).toHaveAttribute("data-active", "false");

    await user.click(historyLink);

    await waitFor(() => {
      expect(historyLink).toHaveAttribute("data-active", "true");
    });
    expect(homeLink).toHaveAttribute("data-active", "false");
  });

  it("shows offcanvas drawer instead of sidebar on mobile", async () => {
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

      // Mobile: drawer closed initially, brand title not mounted
      expect(screen.queryByText("Avaliações")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /alternar menu/i }));
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
