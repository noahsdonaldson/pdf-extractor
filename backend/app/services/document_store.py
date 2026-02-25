from dataclasses import dataclass
from uuid import uuid4

from app.models.pdf_index import TextBlock


@dataclass
class IndexedDocument:
    file_id: str
    token_map: list[TextBlock]
    full_text: str


_DOCUMENTS: dict[str, IndexedDocument] = {}


def store_indexed_document(token_map: list[TextBlock]) -> IndexedDocument:
    file_id = str(uuid4())
    full_text = "\n".join(block.text for block in token_map)
    indexed_document = IndexedDocument(file_id=file_id, token_map=token_map, full_text=full_text)
    _DOCUMENTS[file_id] = indexed_document
    return indexed_document


def get_indexed_document(file_id: str) -> IndexedDocument | None:
    return _DOCUMENTS.get(file_id)
