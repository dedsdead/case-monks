import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface AuthContextValue {
  employeeId: number | null;
  setEmployeeId: (id: number) => void;
  clearEmployee: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employeeId, setEmployeeIdState] = useState<number | null>(() => {
    try {
      // First try to get from localStorage (for backward compatibility)
      const stored = localStorage.getItem("employee_id");
      if (stored) {
        // Validate that the stored value is a valid positive integer
        if (!/^\d+$/.test(stored)) {
          localStorage.removeItem("employee_id");
          return null;
        }
        
        const id = Number(stored);
        if (id <= 0) {
          localStorage.removeItem("employee_id");
          return null;
        }
        
        return id;
      }
      
      // If not in localStorage, try to get from cookie
      const cookies = document.cookie.split(';');
      const employeeCookie = cookies.find(cookie => cookie.trim().startsWith('employee_id='));
      if (employeeCookie) {
        const id = parseInt(employeeCookie.split('=')[1]);
        if (!isNaN(id) && id > 0) {
          return id;
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error reading authentication data:", error);
      localStorage.removeItem("employee_id");
      return null;
    }
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("employee_id");
      if (stored) {
        // Validate that the stored value is a valid positive integer
        if (!/^\d+$/.test(stored)) {
          localStorage.removeItem("employee_id");
          setError("ID de funcionário inválido no armazenamento local");
          return;
        }
        
        const id = Number(stored);
        if (id <= 0) {
          localStorage.removeItem("employee_id");
          setError("ID de funcionário inválido");
          return;
        }
        
        setEmployeeIdState(id);
        setError(null);
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      setError("Erro ao acessar dados de autenticação");
      localStorage.removeItem("employee_id");
    }
  }, []);

  const setEmployeeId = (id: number) => {
    if (typeof id !== 'number' || id <= 0) {
      setError("ID de funcionário inválido");
      return;
    }
    
    try {
      // Set in localStorage for backward compatibility
      localStorage.setItem("employee_id", String(id));
      
      // Set the cookie for backend authentication
      document.cookie = `employee_id=${id}; path=/; domain=backend; max-age=86400; samesite=Lax; secure`;
      
      setEmployeeIdState(id);
      setError(null);
    } catch (error) {
      console.error("Error writing authentication data:", error);
      setError("Falha ao salvar dados de autenticação");
    }
  };

  const clearEmployee = () => {
    try {
      localStorage.removeItem("employee_id");
      
      // Clear the cookie
      document.cookie = "employee_id=; path=/; domain=backend; max-age=0; samesite=Lax; secure";
      
      setEmployeeIdState(null);
      setError(null);
    } catch (error) {
      console.error("Error clearing authentication data:", error);
      setError("Falha ao limpar dados de autenticação");
    }
  };

  return (
    <AuthContext.Provider value={{ employeeId, setEmployeeId, clearEmployee, error }}>
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
