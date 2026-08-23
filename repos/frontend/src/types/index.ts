export interface Employee {
  id: number;
  name: string;
  email: string;
  position_name: string;
}

export interface Question {
  id: number;
  title: string;
  weight: number;
  order: number;
}

export interface QuestionScore {
  question_id: number;
  title: string;
  weight: number;
  score: number;
}

export interface ScoreInput {
  question_id: number;
  score: number;
}

export interface EvaluationCreate {
  employee_id: number;
  scores: ScoreInput[];
}

export interface EvaluationSummary {
  id: number;
  employee_id: number;
  evaluator_id: number;
  total_score: number;
  evaluation_date: string;
  evaluation_year: number;
  week_number: number;
  questions: QuestionScore[];
}

export interface SubordinateEvaluation {
  employee_id: number;
  employee_name: string;
  position_name: string;
  latest_evaluation: EvaluationSummary | null;
  depth: number;
}
