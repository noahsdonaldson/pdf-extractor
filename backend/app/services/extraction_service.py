from typing import Any

import instructor
from openai import OpenAI

from app.services.schema_builder import build_response_model_from_schema


def extract_with_llm(
    *,
    document_text: str,
    json_schema: dict[str, Any],
    openai_api_key: str,
    model_name: str,
) -> dict[str, Any]:
    response_model = build_response_model_from_schema(json_schema)
    client = instructor.from_openai(OpenAI(api_key=openai_api_key))

    system_prompt = (
        "You extract structured information from a document. "
        "Return only values grounded in the source text. "
        "For every extracted field, include a context metadata field that contains the exact snippet "
        "from the document where the value was found. "
        "If a field is invoice_number, include invoice_number_context. "
        "For list fields, include context per item; for scalar lists, include a parallel list context field. "
        "For nested objects, include _context_snippet when useful."
    )

    user_prompt = (
        "Extract data from the document using the required response model.\n\n"
        "Document text:\n"
        f"{document_text}"
    )

    result = client.chat.completions.create(
        model=model_name,
        response_model=response_model,
        temperature=0,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    return result.model_dump()
