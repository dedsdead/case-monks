import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "./useAuth";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  localStorage.clear();
});

describe("useAuth", () => {
  it("returns null employeeId when localStorage is empty", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.employeeId).toBeNull();
  });

  it("reads employeeId from localStorage on mount", () => {
    localStorage.setItem("employee_id", "7");

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.employeeId).toBe(7);
  });

  it("setEmployeeId persists to localStorage and updates state", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setEmployeeId(12);
    });

    expect(result.current.employeeId).toBe(12);
    expect(localStorage.getItem("employee_id")).toBe("12");
  });

  it("clearEmployee removes from localStorage and resets state", () => {
    localStorage.setItem("employee_id", "5");
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.clearEmployee();
    });

    expect(result.current.employeeId).toBeNull();
    expect(localStorage.getItem("employee_id")).toBeNull();
  });

  it("throws when useAuth is used outside AuthProvider", () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within AuthProvider");
  });
});
