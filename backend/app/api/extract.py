from fastapi import APIRouter, Header, HTTPException

from app.models.extract import ExtractRequest, ExtractResponse
from app.services.document_store import get_indexed_document
from app.services.extraction_service import extract_with_llm
from app.services.fuzzy_matcher import map_extraction_to_coordinates

router = APIRouter(tags=["extract"])


@router.post("/extract", response_model=ExtractResponse)
def extract_endpoint(
    request: ExtractRequest,
    x_openai_api_key: str | None = Header(default=None, alias="X-OpenAI-API-Key"),
) -> ExtractResponse:
    indexed_document = get_indexed_document(request.file_id)
    if indexed_document is None:
        raise HTTPException(status_code=404, detail="file_id not found. Index a PDF first.")

    api_key = x_openai_api_key or request.openai_api_key
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="OpenAI API key is required in X-OpenAI-API-Key header or request body.",
        )

    extracted_data = extract_with_llm(
        document_text=indexed_document.full_text,
        json_schema=request.json_schema,
        openai_api_key=api_key,
        model_name=request.model,
    )

    field_matches = map_extraction_to_coordinates(extracted_data, indexed_document.token_map)

    return ExtractResponse(
        file_id=request.file_id,
        data=extracted_data,
        field_matches=field_matches,
    )
