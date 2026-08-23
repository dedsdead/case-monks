import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Toast } from "./Toast";
import { LanguageProvider } from "../../i18n/LanguageContext";

function renderToast(props: Parameters<typeof Toast>[0]) {
  return render(
    <LanguageProvider>
      <Toast {...props} />
    </LanguageProvider>
  );
}

beforeEach(() => {
  localStorage.setItem("language", "en");
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("Toast", () => {
  it("renders success message", () => {
    renderToast({ message: "Done!", type: "success", onClose: vi.fn() });
    expect(screen.getByText("Done!")).toBeInTheDocument();
  });

  it("renders error message", () => {
    renderToast({ message: "Failed", type: "error", onClose: vi.fn() });
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("renders close button for error toasts", () => {
    const onClose = vi.fn();
    renderToast({ message: "Hi", type: "error", onClose });
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("does not render close button for success toasts", () => {
    renderToast({ message: "Done", type: "success", onClose: vi.fn() });
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = (await import("@testing-library/user-event")).default;
    const onClose = vi.fn();
    renderToast({ message: "Failed", type: "error", onClose });

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).not.toHaveBeenCalled();

    // onClose fires after the exit animation delay
    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    }, { timeout: 1000 });
  });

  it("auto-dismisses success toast after 3 seconds", async () => {
    const onClose = vi.fn();
    renderToast({ message: "Done", type: "success", onClose });

    expect(screen.getByText("Done")).toBeInTheDocument();

    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    }, { timeout: 4000 });
  });
});
