import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LanguageProvider } from "../../i18n/LanguageContext";

function renderSwitcher() {
  return render(
    <LanguageProvider>
      <LanguageSwitcher />
    </LanguageProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("language", "pt-BR");
});

describe("LanguageSwitcher", () => {
  it("exposes an accessible trigger labelled with the current language word", () => {
    renderSwitcher();
    expect(
      screen.getByRole("button", { name: "Idioma" })
    ).toBeInTheDocument();
  });

  it("opens a menu with both language options", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.click(screen.getByRole("button", { name: "Idioma" }));

    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: /português/i })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByRole("menuitemradio", { name: /english/i })).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  it("switches to English and updates the trigger label", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.click(screen.getByRole("button", { name: "Idioma" }));
    await user.click(screen.getByRole("menuitemradio", { name: /english/i }));

    await waitFor(() => {
      expect(localStorage.getItem("language")).toBe("en");
    });
    expect(
      screen.getByRole("button", { name: "Language" })
    ).toBeInTheDocument();
  });
});
