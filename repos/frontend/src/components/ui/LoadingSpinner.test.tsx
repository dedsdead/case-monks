import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LoadingSpinner } from "./LoadingSpinner";
import { LanguageProvider } from "../../i18n/LanguageContext";

describe("LoadingSpinner", () => {
  it("renders a spinner element", () => {
    const { container } = render(
      <LanguageProvider>
        <LoadingSpinner />
      </LanguageProvider>,
    );
    const spinner = container.querySelector("div[style*='spin']");
    expect(spinner).toBeInTheDocument();
  });

  it("accepts custom size prop", () => {
    const { container } = render(
      <LanguageProvider>
        <LoadingSpinner size={64} />
      </LanguageProvider>,
    );
    const spinner = container.querySelector("div[style*='spin']");
    expect(spinner).toBeInTheDocument();
  });
});
