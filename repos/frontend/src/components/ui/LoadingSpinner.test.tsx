import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LoadingSpinner } from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders a spinner element", () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector("div[style*='spin']");
    expect(spinner).toBeInTheDocument();
  });

  it("accepts custom size prop", () => {
    const { container } = render(<LoadingSpinner size={64} />);
    const spinner = container.querySelector("div[style*='spin']");
    expect(spinner).toBeInTheDocument();
  });
});
