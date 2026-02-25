from pydantic import BaseModel


class TextBlock(BaseModel):
    page: int
    x0: float
    y0: float
    x1: float
    y1: float
    text: str
    block_index: int


class PageImage(BaseModel):
    page: int
    width: int
    height: int
    image_base64: str


class PdfIndexResponse(BaseModel):
    page_images: list[PageImage]
    token_map: list[TextBlock]
