import { useMemo, useState } from 'react'

import PDFViewer from './components/PDFViewer'
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
  const [resultPayloadInput, setResultPayloadInput] = useState('')
  const [resultData, setResultData] = useState(null)
  const [fieldMatches, setFieldMatches] = useState([])
  const [activePath, setActivePath] = useState('')
  const [resultError, setResultError] = useState('')

  const schemaJsonPreview = useMemo(() => JSON.stringify(schema, null, 2), [schema])

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

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

  const handleLoadResults = () => {
    setResultError('')

    if (!resultPayloadInput.trim()) {
      setResultData(null)
      setFieldMatches([])
      return
    }

    try {
      const parsed = JSON.parse(resultPayloadInput)
      setResultData(parsed.data || null)
      setFieldMatches(Array.isArray(parsed.field_matches) ? parsed.field_matches : [])
      setActivePath('')
    } catch {
      setResultError('Invalid JSON payload. Paste the backend /extract response shape.')
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
            {fieldMatches.length > 0 && (
              <button
                type="button"
                onClick={() => setActivePath('')}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
              >
                Clear Highlight Filter
              </button>
            )}
          </div>

          <PDFViewer
            pdfFile={pdfFile}
            highlights={fieldMatches}
            activePath={activePath}
            title={documentTitle}
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

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold">Results + Highlight Mapping</h3>
            <p className="mb-2 text-xs text-slate-600">
              Paste backend `/extract` response JSON, then click a field path to highlight its PDF area.
            </p>
            <textarea
              value={resultPayloadInput}
              onChange={(event) => setResultPayloadInput(event.target.value)}
              rows={7}
              className="w-full rounded-md border border-slate-300 p-2 text-xs"
              placeholder='{"data": {...}, "field_matches": [...]}'
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadResults}
                className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white"
              >
                Load Result Payload
              </button>
              {resultError && <span className="text-xs text-rose-600">{resultError}</span>}
            </div>

            {resultData && (
              <pre className="mt-3 max-h-40 overflow-auto rounded-md bg-slate-50 p-3 text-xs text-slate-700">
                {JSON.stringify(resultData, null, 2)}
              </pre>
            )}

            <div className="mt-3 space-y-2">
              {fieldMatches.length === 0 ? (
                <p className="text-xs text-slate-500">No field matches loaded yet.</p>
              ) : (
                fieldMatches.map((item, index) => (
                  <button
                    key={`${item.path}-${index}`}
                    type="button"
                    onClick={() => setActivePath(item.path)}
                    className={`block w-full rounded-md border px-2 py-2 text-left text-xs ${
                      activePath === item.path
                        ? 'border-amber-500 bg-amber-50 text-amber-900'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold">{item.path}</div>
                    <div className="text-slate-600">Page {item.page} • Score {Math.round(item.score)}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
