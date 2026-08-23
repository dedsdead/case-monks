import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../hooks/useAuth";
import { LanguageProvider } from "../i18n/LanguageContext";
import { History } from "./History";
import * as api from "../services/api";

vi.mock("../services/api");

beforeEach(() => {
  localStorage.setItem("employee_id", "4");
  vi.clearAllMocks();
});

function renderHistory(employeeId = "8") {
  return render(
    <MemoryRouter initialEntries={[`/history/${employeeId}`]}>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/history/:employeeId" element={<History />} />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
}

describe("History page", () => {
  it("shows loading spinner initially", () => {
    vi.mocked(api.getEmployee).mockReturnValue(new Promise(() => {}));
    vi.mocked(api.getEvaluationHistory).mockReturnValue(new Promise(() => {}));
    renderHistory();
    expect(screen.queryByText(/histórico/i)).not.toBeInTheDocument();
  });

  it("renders history after loading", async () => {
    vi.mocked(api.getEmployee).mockResolvedValue({
      id: 8,
      name: "Henry",
      email: "henry@co.com",
      position_name: "Developer",
    });
    vi.mocked(api.getEvaluationHistory).mockResolvedValue([]);
    renderHistory();

    await waitFor(() => {
      expect(screen.getByText(/nenhuma avaliação registrada/i)).toBeInTheDocument();
    });
  });

  it("shows error on 403", async () => {
    vi.mocked(api.getEmployee).mockRejectedValue({ response: { status: 403 } });
    vi.mocked(api.getEvaluationHistory).mockResolvedValue([]);
    renderHistory("18");

    await waitFor(() => {
      expect(
        screen.getByText(/não tem acesso/i),
      ).toBeInTheDocument();
    });
  });
});
