import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getEmployees } from "../../services/api";
import type { Employee } from "../../types";
import { LoadingSpinner } from "../ui/LoadingSpinner";

export function LeaderSelector() {
  const { setEmployeeId } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    
    getEmployees(abortController.signal)
      .then(setEmployees)
      .catch((error) => {
        // Ignore aborted requests
        if (error.name !== 'AbortError') {
          console.error("Erro ao carregar funcionários:", error);
          setError("Falha ao carregar lista de funcionários. Tente novamente.");
        }
      })
      .finally(() => {
        // Only set loading to false if not aborted
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });
    
    // Cleanup function to cancel requests when component unmounts
    return () => {
      abortController.abort();
    };
  }, []);

  const handleSelect = () => {
    if (!selectedId) {
      setError("Por favor, selecione um funcionário.");
      return;
    }

    try {
      const employeeId = Number(selectedId);
      if (isNaN(employeeId) || employeeId <= 0) {
        setError("ID de funcionário inválido.");
        return;
      }
      
      // Set the cookie for backend authentication
      document.cookie = `employee_id=${employeeId}; path=/; max-age=86400; samesite=Lax`;
      
      setEmployeeId(employeeId);
      setError(null);
    } catch (error) {
      console.error("Erro ao selecionar funcionário:", error);
      setError("Falha ao autenticar. Tente novamente.");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--color-background)",
          border: "1px solid var(--color-border)",
          borderRadius: "8px",
          padding: "2rem",
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            color: "var(--color-primary)",
            marginBottom: "1.5rem",
            fontSize: "1.5rem",
          }}
        >
          Selecione sua identidade
        </h1>
        
        {error && (
          <div
            style={{
              color: "#dc3545",
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              borderRadius: "4px",
              padding: "0.75rem",
              marginBottom: "1rem",
              fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}
        
        <select
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            setError(null);
          }}
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid var(--color-border)",
            borderRadius: "4px",
            backgroundColor: "var(--color-background)",
            color: "var(--color-primary)",
            fontSize: "1rem",
            marginBottom: "1rem",
          }}
        >
          <option value="">Selecione um funcionário...</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} — {emp.position_name}
            </option>
          ))}
        </select>
        <button
          onClick={handleSelect}
          disabled={!selectedId}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: selectedId
              ? "var(--color-primary)"
              : "var(--color-border)",
            color: "var(--color-background)",
            border: "none",
            borderRadius: "4px",
            cursor: selectedId ? "pointer" : "not-allowed",
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
