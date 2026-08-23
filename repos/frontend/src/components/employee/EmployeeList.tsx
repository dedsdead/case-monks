import { useNavigate } from "react-router-dom";
import { History as HistoryIcon, PencilLine } from "lucide-react";
import type { SubordinateEvaluation } from "../../types";
import { useLanguage, formatDate, formatScore } from "../../i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EmployeeListProps {
  evaluations: SubordinateEvaluation[];
}

function getCurrentIsoWeek(): { year: number; week: number } {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor(
    (now.getTime() - jan1.getTime()) / (24 * 60 * 60 * 1000),
  );
  const week = Math.ceil((days + jan1.getDay() + 1) / 7);
  return { year: now.getFullYear(), week };
}

function isEvaluatedThisWeek(
  eval_: SubordinateEvaluation["latest_evaluation"],
): boolean {
  if (!eval_) return false;
  const current = getCurrentIsoWeek();
  return (
    eval_.evaluation_year === current.year && eval_.week_number === current.week
  );
}

export function EmployeeList({ evaluations }: EmployeeListProps) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  if (evaluations.length === 0) {
    return null;
  }

  return (
    <Card className="animate-slide-up gap-0 overflow-hidden py-0">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('employee')}</TableHead>
                <TableHead>{t('position')}</TableHead>
                <TableHead>{t('score')}</TableHead>
                <TableHead>{t('date')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluations.map((e) => {
                const evaluated = isEvaluatedThisWeek(e.latest_evaluation);
                return (
                  <TableRow key={e.employee_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {e.employee_name}
                        </span>
                        {e.depth > 0 && (
                          <Badge variant="secondary" className="font-medium">
                            {e.depth === 1 ? t('direct') : t('level', { level: e.depth })}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.position_name}
                    </TableCell>
                    <TableCell>
                      {e.latest_evaluation ? (
                        <span className="flex items-center gap-2 font-semibold tabular-nums">
                          {formatScore(e.latest_evaluation.total_score, language)}
                          {evaluated && (
                            <Badge className="font-semibold">
                              {t('evaluatedBadge')}
                            </Badge>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {t('notEvaluated')}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {e.latest_evaluation
                        ? formatDate(e.latest_evaluation.evaluation_date, language, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/evaluate/${e.employee_id}`)}
                          disabled={evaluated}
                          aria-label={t('evaluateEmployee', { name: e.employee_name })}
                        >
                          <PencilLine />
                          {t('evaluate')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/history/${e.employee_id}`)}
                          aria-label={t('viewHistoryFor', { name: e.employee_name })}
                        >
                          <HistoryIcon />
                          {t('history')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
