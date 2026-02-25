# Implementation Plan: PDF Extraction & Validation

## Phase 0: Repository & Environment Setup
1. **Monorepo Structure:** Initialize a Git repository with separate directories for `frontend/` and `backend/`.
2. **Environment:** Setup `.gitignore` for both Python (venv, __pycache__) and Node (node_modules, .env).
3. **Documentation:** Create a root `README.md` explaining the project and setup instructions.

## Phase 1: Backend Foundation (FastAPI & PyMuPDF)
1. **PDF Indexing:** Create an endpoint that parses a PDF and returns:
    - Base64 images of each page for the UI.
    - A "Token Map": A list of all text blocks with their `(page, x0, y0, x1, y1)` coordinates.
2. **Dynamic Pydantic Models:** Utility to convert JSON-based schema definitions into dynamic Pydantic models using `pydantic.create_model`.

## Phase 2: LLM Integration (Instructor & Fuzzy Search)
1. **Contextual Extraction:** Prompt the LLM to return data + `original_text_snippet`.
2. **Fuzzy Matcher:** Backend service using `RapidFuzz` to map snippets to PDF "Token Map" coordinates.

## Phase 3: Frontend Development (React)
1. **Schema Builder:** Recursive UI component to manage nested JSON schema state.
2. **PDF Viewer Overlay:** Render pages with `react-pdf` and an SVG highlight layer.
3. **Template Persistence:** Use `localStorage` for schema JSON objects.

## Phase 4: Interaction & GitHub Finalization
1. **Highlight Trigger:** Connect JSON field clicks to PDF area highlights.
2. **Final Commit:** Ensure all code is linted, documented, and pushed to the main branch.