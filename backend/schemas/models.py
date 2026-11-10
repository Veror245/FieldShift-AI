from pydantic import BaseModel, Field
from typing import Literal

class Task(BaseModel):
    task_id: str
    agent: str
    status: Literal["pending", "running", "complete", "failed"] = "pending"
    error: str | None = None