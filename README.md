# Interactive PDF Extraction Tool

Spec-driven monorepo for extracting structured data from PDFs with area-based validation.

## Monorepo Structure

- `frontend/` — React + Vite UI for schema builder, PDF viewer, and extracted data interaction.
- `backend/` — FastAPI service for PDF indexing, schema handling, and LLM-driven extraction.

## Requirements Snapshot

- PDF upload (1–5 pages)
- Dynamic nested schema builder
- Schema-enforced extraction via `instructor` + OpenAI
- Fuzzy snippet-to-coordinate mapping
- Dual-column UI with clickable field-to-PDF highlights

## Quick Start

### Backend

1. Create and activate Python virtual environment inside `backend/`.
2. Install dependencies:
   - `fastapi`
   - `uvicorn[standard]`
   - `python-multipart`
   - `pymupdf`
   - `pydantic`
   - `instructor`
   - `openai`
   - `rapidfuzz`
3. Run API:
   - `uvicorn app.main:app --reload`

#### Enterprise Proxy / Custom CA (Local Only)

If your network requires a custom certificate chain (for example Cisco proxy interception), keep this local and uncommitted:

- Set `OPENAI_CA_BUNDLE` to your full CA chain file path.
- Optionally set `OPENAI_PROXY_URL` if your proxy is not already available via `HTTPS_PROXY`.
- Example (local shell only):
   - `export OPENAI_CA_BUNDLE=~/certs/cisco-chain.pem`
   - `export OPENAI_PROXY_URL=http://proxy.company.local:8080`

The repository `.gitignore` is configured to ignore common local cert/proxy files under `backend/`.

### Frontend

1. From `frontend/`, install dependencies:
   - `npm install`
2. Start Vite dev server:
   - `npm run dev`

## Current Status

- Phase 0 in progress: repository scaffold and docs
- Phase 1 in progress: FastAPI foundation and PDF indexing endpoint (Task B1)

## Next Milestones

- B2: Dynamic Pydantic model generation from JSON schema
- B3: Integrate `instructor` with OpenAI for constrained extraction
- B4: Fuzzy search utility for coordinate mapping
