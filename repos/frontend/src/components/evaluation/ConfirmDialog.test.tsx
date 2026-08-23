import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./ConfirmDialog";
import { LanguageProvider } from "../../i18n/LanguageContext";

describe("ConfirmDialog", () => {
  it("does not render when isOpen is false", () => {
    render(
      <LanguageProvider>
        <ConfirmDialog
          isOpen={false}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      </LanguageProvider>,
    );
    expect(screen.queryByText(/confirmar envio/i)).not.toBeInTheDocument();
  });

  it("renders confirmation message when open", () => {
    render(
      <LanguageProvider>
        <ConfirmDialog isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} />
      </LanguageProvider>,
    );
    expect(
      screen.getByText(/confirmar envio da avaliação/i),
    ).toBeInTheDocument();
  });

  it("has dialog semantics with aria-modal", () => {
    render(
      <LanguageProvider>
        <ConfirmDialog isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} />
      </LanguageProvider>,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("calls onConfirm when Confirmar clicked", async () => {
    const onConfirm = vi.fn();
    render(
      <LanguageProvider>
        <ConfirmDialog isOpen={true} onConfirm={onConfirm} onCancel={vi.fn()} />
      </LanguageProvider>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /confirmar/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("calls onCancel when Cancelar clicked", async () => {
    const onCancel = vi.fn();
    render(
      <LanguageProvider>
        <ConfirmDialog isOpen={true} onConfirm={vi.fn()} onCancel={onCancel} />
      </LanguageProvider>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onCancel when Escape is pressed", async () => {
    const onCancel = vi.fn();
    render(
      <LanguageProvider>
        <ConfirmDialog isOpen={true} onConfirm={vi.fn()} onCancel={onCancel} />
      </LanguageProvider>,
    );
    const user = userEvent.setup();
    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalled();
  });
});
