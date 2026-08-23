import { useState } from "react";
import { SendHorizontal } from "lucide-react";
import type { Employee, Question } from "../../types";
import { useLanguage, formatScore } from "../../i18n/LanguageContext";
import { ConfirmDialog } from "./ConfirmDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface EvaluationFormProps {
  employee: Employee;
  questions: Question[];
  onSubmit: (scores: Record<number, number>) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export function EvaluationForm({
  employee,
  questions,
  onSubmit,
  isSubmitting = false,
  error,
}: EvaluationFormProps) {
  const { t, language } = useLanguage();
  const [scores, setScores] = useState<Record<number, number>>({});
  const [showConfirm, setShowConfirm] = useState(false);

  const scoredCount = Object.keys(scores).length;
  const allValid =
    questions.length > 0 &&
    scoredCount === questions.length &&
    Object.values(scores).every((s) => s >= 1 && s <= 4);

  const weightedScore = questions.reduce((sum, q) => {
    const score = scores[q.id];
    return score !== undefined ? sum + (score * q.weight) / 100 : sum;
  }, 0);

  const handleScoreChange = (questionId: number, value: string) => {
    const num = value === "" ? NaN : Number(value);
    setScores((prev) => {
      const next = { ...prev };
      if (isNaN(num)) {
        delete next[questionId];
      } else {
        next[questionId] = num;
      }
      return next;
    });
  };

  const handleSubmit = () => {
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onSubmit(scores);
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-semibold tracking-tight">
        {t('evaluate')} — {employee.name}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {employee.position_name}
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
        >
          {error}
        </div>
      )}

      <p className="mt-4 text-sm text-muted-foreground">
        {scoredCount} {t('questionsAnswered')}
        {scoredCount > 0 && (
          <span className="ml-4 font-semibold text-primary">
            {t('partialScore')}: {formatScore(weightedScore, language)}
          </span>
        )}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {questions.map((q) => {
          const val = scores[q.id];
          const hasError = val !== undefined && (val < 1 || val > 4);
          return (
            <Card
              key={q.id}
              className={cn(
                "gap-3 py-4 transition-colors",
                hasError && "border-destructive/50"
              )}
            >
              <CardContent className="flex items-start justify-between gap-4 px-4">
                <span className="text-sm leading-snug font-semibold text-foreground">
                  {q.title}
                </span>
                <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  {t('weight')}: {q.weight}
                </span>
              </CardContent>
              <CardContent className="px-4">
                <Input
                  type="number"
                  min={1}
                  max={4}
                  value={val !== undefined ? val : ""}
                  onChange={(e) => handleScoreChange(q.id, e.target.value)}
                  aria-label={`${t('score')} ${q.title}`}
                  aria-invalid={hasError || undefined}
                  aria-describedby={hasError ? `score-error-${q.id}` : undefined}
                  className={cn("w-24", hasError && "border-destructive")}
                />
                {hasError && (
                  <p
                    id={`score-error-${q.id}`}
                    className="mt-1.5 text-xs text-destructive"
                  >
                    {t('scoreRange')}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8">
        <Button
          onClick={handleSubmit}
          disabled={!allValid || isSubmitting}
          size="lg"
          className="font-semibold"
        >
          <SendHorizontal />
          {isSubmitting ? `${t('evaluating')}...` : t('submitEvaluation')}
        </Button>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
