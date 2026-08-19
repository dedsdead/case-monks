import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Toast } from "./Toast";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Toast", () => {
  it("renders success message", () => {
    render(<Toast message="Done!" type="success" onClose={vi.fn()} />);
    expect(screen.getByText("Done!")).toBeInTheDocument();
  });

  it("renders error message", () => {
    render(<Toast message="Failed" type="error" onClose={vi.fn()} />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("renders close button for error toasts", () => {
    const onClose = vi.fn();
    render(<Toast message="Hi" type="error" onClose={onClose} />);
    expect(screen.getByText("Close")).toBeInTheDocument();
  });

  it("does not render close button for success toasts", () => {
    render(<Toast message="Done" type="success" onClose={vi.fn()} />);
    expect(screen.queryByText("Close")).not.toBeInTheDocument();
  });

  it("renders Close button text for error toast", () => {
    render(<Toast message="Failed" type="error" onClose={vi.fn()} />);
    expect(screen.getByText("Close")).toBeInTheDocument();
  });
});
