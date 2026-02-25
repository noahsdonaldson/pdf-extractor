import base64
import io

import fitz

from app.models.pdf_index import PageImage, TextBlock


class PdfIndexResult:
    def __init__(self, page_images: list[PageImage], token_map: list[TextBlock]) -> None:
        self.page_images = page_images
        self.token_map = token_map


def index_pdf(pdf_bytes: bytes) -> PdfIndexResult:
    document = fitz.open(stream=pdf_bytes, filetype="pdf")
    page_images: list[PageImage] = []
    token_map: list[TextBlock] = []

    for page_number, page in enumerate(document, start=1):
        pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        image_bytes = pixmap.tobytes("png")
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")

        page_images.append(
            PageImage(
                page=page_number,
                width=pixmap.width,
                height=pixmap.height,
                image_base64=image_b64,
            )
        )

        blocks = page.get_text("blocks")
        for block_index, block in enumerate(blocks):
            x0, y0, x1, y1, text, *_ = block
            cleaned_text = (text or "").strip()
            if not cleaned_text:
                continue
            token_map.append(
                TextBlock(
                    page=page_number,
                    x0=float(x0),
                    y0=float(y0),
                    x1=float(x1),
                    y1=float(y1),
                    text=cleaned_text,
                    block_index=block_index,
                )
            )

    document.close()
    return PdfIndexResult(page_images=page_images, token_map=token_map)
