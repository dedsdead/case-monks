"""Employee response schema."""

from pydantic import BaseModel, ConfigDict


class EmployeeResponse(BaseModel):
    """Schema for employee data in API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    position_name: str
