import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../src/App";
import * as api from "../src/services/api";

vi.mock("../src/services/api");

function setViewport(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
}

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  setViewport(1024);
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
});

afterEach(() => {
  setViewport(1024);
  localStorage.clear();
});

describe("Layout Responsiveness", () => {
  it("displays expanded sidebar on desktop", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Meus Subordinados")).toBeInTheDocument();
    });

    expect(screen.getByText("Avaliações")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Início" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Histórico de Avaliações" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /alternar menu/i })
    ).toHaveLength(1);
  });

  it("shows closed drawer and toggle button on mobile", async () => {
    setViewport(500);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Meus Subordinados")).toBeInTheDocument();
    });

    // Drawer starts closed on mobile
    expect(screen.queryByText("Avaliações")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /alternar menu/i })
    ).toBeInTheDocument();
  });

  it("toggles drawer open and closed on mobile", async () => {
    setViewport(500);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Meus Subordinados")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /alternar menu/i }));
    expect(screen.getByText("Avaliações")).toBeInTheDocument();

    fireEvent.keyDown(document.body, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByText("Avaliações")).not.toBeInTheDocument();
    });
  });

  it("adapts layout when window is resized", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Meus Subordinados")).toBeInTheDocument();
    });

    // Desktop initially
    expect(screen.getByText("Avaliações")).toBeInTheDocument();

    // Resize down to mobile width
    setViewport(500);
    window.dispatchEvent(new Event("resize"));

    await waitFor(() => {
      expect(screen.queryByText("Avaliações")).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /alternar menu/i })
    ).toBeInTheDocument();
  });
});
