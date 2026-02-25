# Requirements: Interactive PDF Extraction Tool

## Project Goal
An interactive web application to extract structured, nested data from 1-5 page PDFs using dynamic user-defined schemas and OpenAI. The tool features a dual-column interface with area-based highlighting to facilitate human validation of LLM extractions.

## Functional Requirements
- **PDF Upload:** Support 1-5 page PDF files with an optional "Document Title" field.
- **API Key Management:** A UI field for users to input their OpenAI API Key (not stored server-side).
- **Dynamic Schema Builder:** 
    - UI to define fields with types: `String`, `Number`, `Object`, or `List`.
    - Support for deep nesting (e.g., a list of objects containing other objects).
- **Template System:** Ability to save a schema configuration and reload it for future documents.
- **LLM Extraction:** 
    - Use OpenAI via the `instructor` library for schema-enforced JSON output.
    - Implement "Fuzzy String Search" to map extracted text back to PDF coordinates.
- **Dual-Column Interface:**
    - **Left:** High-fidelity PDF viewer with an SVG/Canvas highlight overlay.
    - **Right:** Interactive JSON/Form view of extracted data.
- **Area Highlighting:** Clicking an extracted field in the right panel draws a box around the corresponding area in the PDF.

## Technical Stack & DevOps
- **Frontend:** React.js (Vite).
- **Backend:** Python (FastAPI).
- **PDF Processing:** PyMuPDF (fitz).
- **LLM Orchestration:** `instructor` + `openai` + `pydantic`.
- **Version Control:** GitHub (Monorepo structure: `/frontend` and `/backend`).

## Non-Goals
- Permanent database storage for PDFs (session-based).
- OCR for scanned images (focus on text-based PDFs for MVP).
- Multi-user authentication.