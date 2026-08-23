import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getEmployees } from "../../services/api";
import type { Employee } from "../../types";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { useLanguage } from "../../i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
        if (!abortController.signal.aborted) {
          console.error("Error loading employees:", error);
          setError(t('loadEmployeesError'));
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

  const handleSelect = () => {
    if (!selectedId) {
      setError(t('selectEmployeeRequired'));
      return;
    }

    try {
      const employeeId = Number(selectedId);
      if (Number.isNaN(employeeId) || employeeId <= 0) {
        setError(t('invalidEmployeeId'));
        return;
      }

      // setEmployeeId persists to localStorage and the auth cookie
      setEmployeeId(employeeId);
      setError(null);
    } catch (error) {
      console.error("Error selecting employee:", error);
      setError(t('authError'));
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-svh place-items-center bg-background p-4">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="grid min-h-svh place-items-center bg-background p-4">
      <Card className="w-full max-w-sm animate-slide-up gap-4 py-8 text-center shadow-lg">
        <CardHeader className="flex flex-col items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <ClipboardList className="size-6" />
          </span>
          <CardTitle className="text-xl">{t('selectLeaderTitle')}</CardTitle>
          <CardDescription>{t('selectIdentity')}</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
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
            className="h-11 w-full appearance-none rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50"
          >
            <option value="">{t('selectEmployeePlaceholder')}</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} — {emp.position_name}
              </option>
            ))}
          </select>

          <Button
            onClick={handleSelect}
            disabled={!selectedId}
            size="lg"
            className="w-full font-semibold"
          >
            {t('login')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
