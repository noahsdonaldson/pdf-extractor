from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.pdf_index import PdfIndexResponse
from app.services.document_store import store_indexed_document
from app.services.pdf_indexer import index_pdf

router = APIRouter(prefix="/pdf", tags=["pdf"])


@router.post("/index", response_model=PdfIndexResponse)
async def index_pdf_endpoint(file: UploadFile = File(...)) -> PdfIndexResponse:
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Uploaded PDF is empty.")

    indexed = index_pdf(pdf_bytes)
    indexed_document = store_indexed_document(indexed.token_map)
    return PdfIndexResponse(
        file_id=indexed_document.file_id,
        page_images=indexed.page_images,
        token_map=indexed.token_map,
    )
