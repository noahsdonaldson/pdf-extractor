from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.pdf import router as pdf_router

app = FastAPI(title="Interactive PDF Extraction API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pdf_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
