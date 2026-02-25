import { useEffect, useMemo, useState } from 'react'

import PDFViewer from './components/PDFViewer'
import ResultsView from './components/ResultsView'
import SchemaBuilder from './components/SchemaBuilder'

const TEMPLATE_STORAGE_KEY = 'pdf-extractor:schema-template'

const defaultSchema = {
  type: 'object',
  properties: {
    invoice_number: { type: 'string' },
    total_amount: { type: 'number' },
  },
}

function App() {
  const [openAiApiKey, setOpenAiApiKey] = useState('')
  const [documentTitle, setDocumentTitle] = useState('')
  const [schema, setSchema] = useState(defaultSchema)
  const [pdfFile, setPdfFile] = useState(null)
  const [resultData, setResultData] = useState(null)
  const [fieldMatches, setFieldMatches] = useState([])
  const [activePath, setActivePath] = useState('')
  const [extractError, setExtractError] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)

  const schemaJsonPreview = useMemo(() => JSON.stringify(schema, null, 2), [schema])

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setPdfFile(file)
  }

  const handlePdfDrop = (file) => {
    if (!file) {
      return
    }

    if (file.type !== 'application/pdf') {
      setExtractError('Only PDF files are supported for upload.')
      return
    }

    setExtractError('')
    setPdfFile(file)
  }

  const handleSaveTemplate = () => {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(schema))
  }

  const handleLoadTemplate = () => {
    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY)
    if (!raw) {
      return
    }

    try {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.type === 'object') {
        setSchema(parsed)
      }
    } catch {
      // no-op
    }
  }

  useEffect(() => {
    const onDocumentClick = (event) => {
      if (!(event.target instanceof Element)) {
        return
      }

      if (event.target.closest('[data-result-item="true"]')) {
        return
      }

      setActivePath('')
    }

    window.document.addEventListener('click', onDocumentClick)
    return () => {
      window.document.removeEventListener('click', onDocumentClick)
    }
  }, [])

  const handleExtract = async () => {
    setExtractError('')

    if (!pdfFile) {
      setExtractError('Please upload a PDF before extracting.')
      return
    }

    if (!openAiApiKey.trim()) {
      setExtractError('Please provide an OpenAI API key.')
      return
    }

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

    setIsExtracting(true)
    try {
      const indexFormData = new FormData()
      indexFormData.append('file', pdfFile)

      const indexResponse = await fetch(`${apiBase}/pdf/index`, {
        method: 'POST',
        body: indexFormData,
      })

      if (!indexResponse.ok) {
        throw new Error('PDF indexing failed. Check backend logs.')
      }

      const indexPayload = await indexResponse.json()
      const fileId = indexPayload.file_id

      const extractResponse = await fetch(`${apiBase}/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OpenAI-API-Key': openAiApiKey,
        },
        body: JSON.stringify({
          file_id: fileId,
          json_schema: schema,
        }),
      })

      if (!extractResponse.ok) {
        const errorPayload = await extractResponse.json().catch(() => ({}))
        throw new Error(errorPayload.detail || 'Extraction request failed.')
      }

      const extractPayload = await extractResponse.json()
      const nextMatches = Array.isArray(extractPayload.field_matches) ? extractPayload.field_matches : []

      setResultData(extractPayload.data || null)
      setFieldMatches(nextMatches)
      setActivePath('')

      console.debug('Extracted coordinate matches', nextMatches)
    } catch (error) {
      setExtractError(error instanceof Error ? error.message : 'Unexpected extraction error.')
    } finally {
      setIsExtracting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Interactive PDF Extraction Tool</h1>
            <p className="text-sm text-slate-600">Phase 3: Schema Builder, PDF Viewer, and Highlight Interaction</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <input
              value={documentTitle}
              onChange={(event) => setDocumentTitle(event.target.value)}
              placeholder="Document Title"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={openAiApiKey}
              onChange={(event) => setOpenAiApiKey(event.target.value)}
              placeholder="OpenAI API Key"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleSaveTemplate}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
            >
              Save Template
            </button>
            <button
              type="button"
              onClick={handleLoadTemplate}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium"
            >
              Load Template
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[58%_42%]">
        <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="text-sm"
            />
            <button
              type="button"
              onClick={handleExtract}
              disabled={isExtracting}
              className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExtracting ? 'Extracting…' : 'Extract'}
            </button>
          </div>

          <PDFViewer
            pdfFile={pdfFile}
            highlights={fieldMatches}
            activePath={activePath}
            title={documentTitle}
            onDropFile={handlePdfDrop}
          />
        </section>

        <section className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <SchemaBuilder schema={schema} onChange={setSchema} />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Schema JSON Payload</h3>
              <span className="text-xs text-slate-500">Send this object to /extract</span>
            </div>
            <pre className="max-h-56 overflow-auto rounded-md bg-slate-50 p-3 text-xs text-slate-700">
              {schemaJsonPreview}
            </pre>
          </div>

          <ResultsView
            resultData={resultData}
            fieldMatches={fieldMatches}
            activePath={activePath}
            onSelectPath={setActivePath}
            onClearSelection={() => setActivePath('')}
            loading={isExtracting}
            error={extractError}
          />
        </section>
      </main>
    </div>
  )
}

export default App
