from fastapi import APIRouter, Header, HTTPException
from instructor.core.exceptions import InstructorRetryException
from openai import APIConnectionError, APIError

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

    try:
        extracted_data = extract_with_llm(
            document_text=indexed_document.full_text,
            json_schema=request.json_schema,
            openai_api_key=api_key,
            model_name=request.model,
        )
    except APIConnectionError as error:
        raise HTTPException(
            status_code=502,
            detail=(
                "Failed to connect to OpenAI API. "
                "If you are on macOS and seeing SSL certificate issues, run: "
                "'/Applications/Python 3.13/Install Certificates.command' and restart the backend. "
                f"Original error: {error}"
            ),
        ) from error
    except APIError as error:
        raise HTTPException(status_code=502, detail=f"OpenAI API request failed: {error}") from error
    except InstructorRetryException as error:
        message = str(error)
        lowered = message.lower()
        if "invalid_api_key" in lowered or "incorrect api key" in lowered or "error code: 401" in lowered:
            raise HTTPException(
                status_code=401,
                detail="OpenAI authentication failed. Please verify your API key.",
            ) from error
        if "connection error" in lowered or "certificate_verify_failed" in lowered:
            raise HTTPException(
                status_code=502,
                detail=(
                    "OpenAI connection failed after retries. "
                    "Check OPENAI_CA_BUNDLE / proxy settings and full certificate chain."
                ),
            ) from error
        raise HTTPException(status_code=502, detail=f"LLM extraction failed after retries: {message}") from error
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

    field_matches = map_extraction_to_coordinates(extracted_data, indexed_document.token_map)

    return ExtractResponse(
        file_id=request.file_id,
        data=extracted_data,
        field_matches=field_matches,
    )
