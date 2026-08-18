"""Evaluation schemas for request/response validation."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ScoreInput(BaseModel):
    """A single question score in an evaluation submission."""

    model_config = ConfigDict(extra="forbid")

    question_id: int = Field(ge=1, le=6)
    score: int = Field(ge=1, le=4)


class EvaluationCreate(BaseModel):
    """Request body for creating an evaluation."""

    model_config = ConfigDict(extra="forbid")

    employee_id: int
    scores: list[ScoreInput]

    @model_validator(mode="after")
    def validate_scores(self) -> "EvaluationCreate":
        """Ensure exactly 6 scores with unique, sequential question IDs."""
        if len(self.scores) != 6:
            raise ValueError("Exactly 6 scores are required")
        ids = [s.question_id for s in self.scores]
        if sorted(ids) != [1, 2, 3, 4, 5, 6]:
            raise ValueError("Question IDs must be 1-6, each appearing once")
        return self


class QuestionScoreResponse(BaseModel):
    """Question with score in an evaluation summary."""

    model_config = ConfigDict(from_attributes=True)

    question_id: int
    title: str
    weight: int
    score: int


class EvaluationSummaryResponse(BaseModel):
    """Full evaluation summary with nested question responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    evaluator_id: int
    total_score: float
    evaluation_date: datetime
    evaluation_year: int
    week_number: int
    questions: list[QuestionScoreResponse]


class QuestionResponse(BaseModel):
    """Question data for the evaluation form."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    weight: int
    order: int


class SubordinateEvaluationResponse(BaseModel):
    """Subordinate with their latest evaluation summary."""

    employee_id: int
    employee_name: str
    position_name: str
    latest_evaluation: EvaluationSummaryResponse | None
    depth: int
