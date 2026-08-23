import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getEmployees } from "../../services/api";
import type { Employee } from "../../types";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { useLanguage } from "../../i18n/LanguageContext";

export function LeaderSelector() {
  const { setEmployeeId } = useAuth();
  const { t } = useLanguage();
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
          console.error("Error loading employees:", error);
          setError(t('loadEmployeesError'));
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
  }, [t]);

  const handleSelect = () => {
    if (!selectedId) {
      setError(t('selectEmployeeRequired'));
      return;
    }

    try {
      const employeeId = Number(selectedId);
      if (isNaN(employeeId) || employeeId <= 0) {
        setError(t('invalidEmployeeId'));
        return;
      }

      // Set the cookie for backend authentication
      document.cookie = `employee_id=${employeeId}; path=/; max-age=86400; samesite=Lax`;

      setEmployeeId(employeeId);
      setError(null);
    } catch (error) {
      console.error("Error selecting employee:", error);
      setError(t('authError'));
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
          {t('selectLeaderTitle')}
        </h1>

        {error && (
          <div
            role="alert"
            style={{
              color: "var(--color-danger)",
              backgroundColor: "var(--color-danger-background)",
              border: "1px solid var(--color-danger-border)",
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
          aria-label={t('selectIdentity')}
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
          <option value="">{t('selectEmployeePlaceholder')}</option>
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
          {t('login')}
        </button>
      </div>
    </div>
  );
}
