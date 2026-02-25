from typing import Any

from pydantic import BaseModel, Field


class ExtractRequest(BaseModel):
    file_id: str
    json_schema: dict[str, Any]
    openai_api_key: str | None = None
    model: str = "gpt-4.1-mini"


class FieldMatch(BaseModel):
    path: str
    snippet: str
    matched_text: str
    score: float
    page: int
    x0: float
    y0: float
    x1: float
    y1: float
    block_index: int


class ExtractResponse(BaseModel):
    file_id: str
    data: dict[str, Any]
    field_matches: list[FieldMatch] = Field(default_factory=list)
