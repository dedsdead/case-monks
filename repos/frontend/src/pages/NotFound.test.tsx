import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NotFound } from "./NotFound";

describe("NotFound", () => {
  it("renders 404 message", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );
    expect(screen.getByText("Página não encontrada")).toBeInTheDocument();
  });

  it("renders link to home", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );
    const link = screen.getByText("Voltar para o início");
    expect(link).toHaveAttribute("href", "/");
  });
});
