from typing import Any
import os
from pathlib import Path

import certifi
import httpx
import instructor
from openai import OpenAI

from app.services.schema_builder import build_response_model_from_schema


def _resolve_verify_path() -> str:
    ca_bundle = os.getenv("OPENAI_CA_BUNDLE") or os.getenv("SSL_CERT_FILE")
    if ca_bundle:
        candidate = Path(ca_bundle).expanduser().resolve()
        if not candidate.exists():
            raise RuntimeError(
                f"Configured CA bundle does not exist: {candidate}. "
                "Set OPENAI_CA_BUNDLE (or SSL_CERT_FILE) to a valid certificate chain file."
            )
        return str(candidate)

    return certifi.where()


def extract_with_llm(
    *,
    document_text: str,
    json_schema: dict[str, Any],
    openai_api_key: str,
    model_name: str,
) -> dict[str, Any]:
    response_model = build_response_model_from_schema(json_schema)
    verify_path = _resolve_verify_path()
    proxy_url = os.getenv("OPENAI_PROXY_URL")
    client_kwargs: dict[str, Any] = {
        "verify": verify_path,
        "timeout": 60.0,
        "trust_env": True,
    }
    if proxy_url:
        client_kwargs["proxy"] = proxy_url

    http_client = httpx.Client(**client_kwargs)
    client = instructor.from_openai(OpenAI(api_key=openai_api_key, http_client=http_client))

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

    try:
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
    finally:
        http_client.close()
