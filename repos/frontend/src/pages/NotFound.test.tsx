import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NotFound } from "./NotFound";
import { LanguageProvider } from "../i18n/LanguageContext";

describe("NotFound", () => {
  it("renders 404 message", () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <NotFound />
        </LanguageProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText("Página não encontrada")).toBeInTheDocument();
  });

  it("renders link to home", () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <NotFound />
        </LanguageProvider>
      </MemoryRouter>,
    );
    const link = screen.getByText("Voltar para o início");
    expect(link).toHaveAttribute("href", "/");
  });
});
