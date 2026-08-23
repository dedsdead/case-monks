import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "./LoadingSpinner";
import { LanguageProvider } from "../../i18n/LanguageContext";

describe("LoadingSpinner", () => {
  it("renders a status region with a spinner icon", () => {
    render(
      <LanguageProvider>
        <LoadingSpinner />
      </LanguageProvider>,
    );
    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status.querySelector("svg")).toBeInTheDocument();
  });

  it("accepts custom size prop", () => {
    render(
      <LanguageProvider>
        <LoadingSpinner size={64} />
      </LanguageProvider>,
    );
    const status = screen.getByRole("status");
    expect(status.querySelector("svg")).toBeInTheDocument();
  });
});
