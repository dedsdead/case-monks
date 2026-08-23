import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { EvaluationSummary } from "../../types";
import {
  useLanguage,
  formatDate,
  formatScore,
  type Language,
} from "../../i18n/LanguageContext";
import { EvaluationDetail } from "./EvaluationDetail";
import { EmptyState } from "../ui/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EvaluationHistoryProps {
  history: EvaluationSummary[];
  employeeName: string;
}

export function EvaluationHistory({ history, employeeName }: EvaluationHistoryProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { t, language } = useLanguage();

  if (history.length === 0) {
    return <EmptyState message={t('noEvaluations')} />;
  }

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b px-4 py-4 [.border-b]:pb-4 md:px-6">
        <CardTitle className="text-base md:text-lg">
          {t('history')} — {employeeName}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('week')}</TableHead>
                <TableHead>{t('year')}</TableHead>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('score')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((eval_) => (
                <EvaluationRow
                  key={eval_.id}
                  evaluation={eval_}
                  language={language}
                  isExpanded={expandedId === eval_.id}
                  onToggle={() =>
                    setExpandedId(expandedId === eval_.id ? null : eval_.id)
                  }
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function EvaluationRow({
  evaluation,
  language,
  isExpanded,
  onToggle,
}: {
  evaluation: EvaluationSummary;
  language: Language;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useLanguage();

  return (
    <>
      <TableRow>
        <TableCell className="font-medium tabular-nums">
          {evaluation.week_number}
        </TableCell>
        <TableCell className="tabular-nums text-muted-foreground">
          {evaluation.evaluation_year}
        </TableCell>
        <TableCell className="whitespace-nowrap text-muted-foreground">
          {formatDate(evaluation.evaluation_date, language)}
        </TableCell>
        <TableCell>
          <span className="font-semibold tabular-nums text-primary">
            {formatScore(evaluation.total_score, language)}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex justify-end">
            <Button
              size="sm"
              variant={isExpanded ? "default" : "outline"}
              onClick={onToggle}
              aria-expanded={isExpanded}
            >
              {isExpanded ? <ChevronUp /> : <ChevronDown />}
              {isExpanded ? t('hideDetails') : t('details')}
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={5} className="bg-muted/40 p-0">
            <EvaluationDetail summary={evaluation} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
