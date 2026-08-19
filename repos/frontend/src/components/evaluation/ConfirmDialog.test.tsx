import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("does not render when isOpen is false", () => {
    render(
      <ConfirmDialog
        isOpen={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByText(/confirmar envio/i)).not.toBeInTheDocument();
  });

  it("renders confirmation message when open", () => {
    render(
      <ConfirmDialog isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(
      screen.getByText(/confirmar envio da avaliação/i),
    ).toBeInTheDocument();
  });

  it("calls onConfirm when Confirmar clicked", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog isOpen={true} onConfirm={onConfirm} onCancel={vi.fn()} />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /confirmar/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("calls onCancel when Cancelar clicked", async () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog isOpen={true} onConfirm={vi.fn()} onCancel={onCancel} />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
