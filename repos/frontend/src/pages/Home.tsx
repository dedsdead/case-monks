import { useEffect, useState } from "react";
import { getSubordinateEvaluations } from "../services/api";
import type { SubordinateEvaluation } from "../types";
import { EmployeeList } from "../components/employee/EmployeeList";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Toast } from "../components/ui/Toast";
import { useLanguage } from "../i18n/LanguageContext";

export function Home() {
  const [evaluations, setEvaluations] = useState<SubordinateEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const abortController = new AbortController();

    getSubordinateEvaluations(abortController.signal)
      .then(setEvaluations)
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setError(t('loadDataError'));
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [t]);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    const abortController = new AbortController();

    getSubordinateEvaluations(abortController.signal)
      .then(setEvaluations)
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setError(t('loadDataError'));
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });
  };

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div style={styles.errorContainer}>
      <p style={styles.errorText}>{error}</p>
      <button onClick={handleRefresh} className="btn btn-secondary">
        {t('retry')}
      </button>
    </div>
  );
  if (evaluations.length === 0)
    return (
      <EmptyState message="Você não possui subordinados para avaliar." />
    );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 className="page-title">Meus Subordinados</h1>
          <p className="page-subtitle">{evaluations.length} funcionário(s) na sua hierarquia</p>
        </div>
        <button onClick={handleRefresh} className="btn btn-secondary">
          ↻ {t('refresh')}
        </button>
      </div>
      <EmployeeList evaluations={evaluations} />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    animation: 'fadeIn 0.3s ease-in',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '0',
    animation: 'slideUp 0.3s ease-out',
  } as React.CSSProperties,
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    color: 'var(--color-muted)',
    textAlign: 'center',
    gap: '1.5rem',
    animation: 'fadeIn 0.3s ease-in',
  } as React.CSSProperties,
  errorText: {
    fontSize: '1.1rem',
    margin: '0',
    maxWidth: '500px',
  } as React.CSSProperties,
};
