import type { EvaluationSummary } from "../../types";
import { useLanguage, formatScore } from "../../i18n/LanguageContext";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EvaluationDetailProps {
  summary: EvaluationSummary;
}

export function EvaluationDetail({ summary }: EvaluationDetailProps) {
  const { t, language } = useLanguage();

  return (
    <div className="p-2 md:p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">{t('question')}</TableHead>
            <TableHead className="text-xs">{t('weight')}</TableHead>
            <TableHead className="text-xs">{t('score')}</TableHead>
            <TableHead className="text-xs">{t('contribution')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summary.questions.map((q) => (
            <TableRow key={q.question_id}>
              <TableCell className="text-sm">{q.title}</TableCell>
              <TableCell className="tabular-nums text-muted-foreground">
                {q.weight}
              </TableCell>
              <TableCell className="font-semibold tabular-nums">
                {q.score}
              </TableCell>
              <TableCell className="tabular-nums text-primary">
                {formatScore((q.score * q.weight) / 100, language)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="font-bold">
              {t('total')}
            </TableCell>
            <TableCell className="font-bold tabular-nums text-primary">
              {formatScore(summary.total_score, language)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
