import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

interface AuthContextValue {
  employeeId: number | null;
  setEmployeeId: (id: number) => void;
  clearEmployee: () => void;
  /** Clears cookie + localStorage + state without redirecting (session-expiry recovery). */
  resetEmployee: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): { id: number | null; error: string | null } {
  try {
    // First try to get from localStorage (for backward compatibility)
    const stored = localStorage.getItem("employee_id");
    if (stored) {
      // Validate that the stored value is a valid positive integer
      if (!/^\d+$/.test(stored)) {
        localStorage.removeItem("employee_id");
        return { id: null, error: "Invalid employee ID in local storage" };
      }

      const id = Number(stored);
      if (id <= 0) {
        localStorage.removeItem("employee_id");
        return { id: null, error: "Invalid employee ID" };
      }

      return { id, error: null };
    }

    // If not in localStorage, try to get from cookie
    const cookies = document.cookie.split(';');
    const employeeCookie = cookies.find(cookie => cookie.trim().startsWith('employee_id='));
    if (employeeCookie) {
      const id = parseInt(employeeCookie.split('=')[1]);
      if (!isNaN(id) && id > 0) {
        return { id, error: null };
      }
    }

    return { id: null, error: null };
  } catch (error) {
    console.error("Error reading authentication data:", error);
    localStorage.removeItem("employee_id");
    return { id: null, error: "Error accessing authentication data" };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialAuth] = useState(readStoredAuth);
  const [employeeId, setEmployeeIdState] = useState<number | null>(initialAuth.id);
  const [error, setError] = useState<string | null>(initialAuth.error);

  const setEmployeeId = (id: number) => {
    if (typeof id !== 'number' || id <= 0) {
      setError("Invalid employee ID");
      return;
    }
    
    try {
      // Set in localStorage for backward compatibility
      localStorage.setItem("employee_id", String(id));
      
      // Set the cookie for backend authentication
      // Use import.meta.env for Vite environment detection
      const isProduction = import.meta.env.PROD;
      document.cookie = `employee_id=${id}; path=/; max-age=86400; samesite=Lax; secure=${isProduction}`;
      
      setEmployeeIdState(id);
      setError(null);
    } catch (error) {
      console.error("Error writing authentication data:", error);
      setError("Failed to save authentication data");
    }
  };

  const clearEmployee = () => {
    try {
      localStorage.removeItem("employee_id");
      
      // Clear the cookie
      // Use import.meta.env for Vite environment detection
      const isProduction = import.meta.env.PROD;
      document.cookie = "employee_id=; path=/; max-age=0; samesite=Lax; secure=" + isProduction;
      
      setEmployeeIdState(null);
      setError(null);
      
      // Redirect to home page to update permissions and access
      window.location.href = "/";
    } catch (error) {
      console.error("Error clearing authentication data:", error);
      setError("Failed to clear authentication data");
      // Fallback redirect in case of error
      window.location.href = "/";
    }
  };

  /**
   * Full identity reset without the redirect performed by clearEmployee().
   * Used on 401 responses so the current render can switch to the
   * leader-selector prompt instead of resurrecting the rejected id from
   * the cookie on the next reload.
   */
  const resetEmployee = useCallback(() => {
    try {
      localStorage.removeItem("employee_id");

      const isProduction = import.meta.env.PROD;
      document.cookie =
        "employee_id=; path=/; max-age=0; samesite=Lax; secure=" + isProduction;
    } catch (error) {
      console.error("Error resetting authentication data:", error);
    }

    setEmployeeIdState(null);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ employeeId, setEmployeeId, clearEmployee, resetEmployee, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
