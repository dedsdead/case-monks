import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../hooks/useAuth";
import { LanguageProvider } from "../i18n/LanguageContext";
import { Evaluate } from "./Evaluate";
import * as api from "../services/api";

vi.mock("../services/api");

beforeEach(() => {
  localStorage.setItem("employee_id", "4");
  vi.clearAllMocks();
});

function renderEvaluate(employeeId = "8") {
  return render(
    <MemoryRouter initialEntries={[`/evaluate/${employeeId}`]}>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/evaluate/:employeeId" element={<Evaluate />} />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
}

describe("Evaluate page", () => {
  it("shows loading spinner initially", () => {
    vi.mocked(api.getEmployee).mockReturnValue(new Promise(() => {}));
    vi.mocked(api.getQuestions).mockReturnValue(new Promise(() => {}));
    renderEvaluate();
    expect(screen.queryByText(/avaliar/i)).not.toBeInTheDocument();
  });

  it("renders form after loading", async () => {
    vi.mocked(api.getEmployee).mockResolvedValue({
      id: 8,
      name: "Henry",
      email: "henry@co.com",
      position_name: "Developer",
    });
    vi.mocked(api.getQuestions).mockResolvedValue([
      { id: 1, title: "Entrega de Resultados", weight: 25, order: 1 },
      { id: 2, title: "Execução e Qualidade", weight: 20, order: 2 },
      { id: 3, title: "Capacidade de Aprendizado", weight: 20, order: 3 },
      { id: 4, title: "Resolução de Problemas", weight: 15, order: 4 },
      { id: 5, title: "Colaboração e Liderança", weight: 10, order: 5 },
      { id: 6, title: "Visão Estratégica", weight: 10, order: 6 },
    ]);
    renderEvaluate();

    await waitFor(() => {
      expect(screen.getAllByText(/henry/i).length).toBeGreaterThan(0);
    });
    expect(screen.getByText("Entrega de Resultados")).toBeInTheDocument();
  });

  it("shows error on 404", async () => {
    vi.mocked(api.getEmployee).mockRejectedValue({ response: { status: 404 } });
    vi.mocked(api.getQuestions).mockResolvedValue([]);
    renderEvaluate("999");

    await waitFor(() => {
      expect(screen.getByText(/funcionário não encontrado/i)).toBeInTheDocument();
    });
  });

  it("AC-33: shows error on 403 when evaluating self", async () => {
    vi.mocked(api.getEmployee).mockRejectedValue({ response: { status: 403 } });
    vi.mocked(api.getQuestions).mockResolvedValue([]);
    renderEvaluate("4"); // Employee 4 (current user in beforeEach)

    await waitFor(() => {
      expect(screen.getByText(/não tem acesso/i)).toBeInTheDocument();
    });
  });
});
