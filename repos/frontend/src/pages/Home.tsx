import { useEffect, useState } from "react";
import { getSubordinateEvaluations } from "../services/api";
import type { SubordinateEvaluation } from "../types";
import { EmployeeList } from "../components/employee/EmployeeList";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

export function Home() {
  const [evaluations, setEvaluations] = useState<SubordinateEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    
    getSubordinateEvaluations(abortController.signal)
      .then(setEvaluations)
      .catch((error) => {
        // Ignore aborted requests
        if (error.name !== 'AbortError') {
          setError("Erro ao carregar subordinados. Tente novamente.");
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

  if (loading) return <LoadingSpinner />;
  if (error) return <EmptyState message={error} />;
  if (evaluations.length === 0)
    return (
      <EmptyState message="Você não possui subordinados para avaliar." />
    );

  return (
    <div>
      <h1 style={{ color: "var(--color-primary)", marginBottom: "0.5rem" }}>
        Meus Subordinados
      </h1>
      <p style={{ color: "var(--color-muted)", marginBottom: "1rem" }}>
        {evaluations.length} funcionário(s) na sua hierarquia
      </p>
      <EmployeeList evaluations={evaluations} />
    </div>
  );
}
