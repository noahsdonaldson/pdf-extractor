import { useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export default function PDFViewer({ pdfFile, highlights, activePath, title }) {
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [numPages, setNumPages] = useState(0)
  const [pageDimensions, setPageDimensions] = useState({})

  useEffect(() => {
    const element = containerRef.current
    if (!element) {
      return undefined
    }

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width || 0
      setContainerWidth(Math.floor(width))
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const groupedHighlights = useMemo(() => {
    const map = new Map()
    for (const highlight of highlights || []) {
      if (activePath && highlight.path !== activePath) {
        continue
      }
      if (!map.has(highlight.page)) {
        map.set(highlight.page, [])
      }
      map.get(highlight.page).push(highlight)
    }
    return map
  }, [activePath, highlights])

  if (!pdfFile) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
        Upload a PDF to preview it here.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-600">{title || 'Untitled document'}</div>

      <div ref={containerRef} className="space-y-4">
        <Document
          file={pdfFile}
          onLoadSuccess={({ numPages: loadedPages }) => setNumPages(loadedPages)}
          loading={<div className="text-sm text-slate-500">Loading PDF...</div>}
        >
          {Array.from({ length: numPages }, (_, index) => {
            const pageNumber = index + 1
            const dimensions = pageDimensions[pageNumber]
            const renderedHeight = dimensions && containerWidth
              ? (containerWidth * dimensions.height) / dimensions.width
              : 0

            const pageHighlights = groupedHighlights.get(pageNumber) || []

            return (
              <div key={pageNumber} className="relative rounded-md border border-slate-200 bg-white shadow-sm">
                <Page
                  pageNumber={pageNumber}
                  width={containerWidth || undefined}
                  onLoadSuccess={(page) => {
                    setPageDimensions((previous) => ({
                      ...previous,
                      [pageNumber]: { width: page.width, height: page.height },
                    }))
                  }}
                />

                {dimensions && renderedHeight > 0 && (
                  <svg
                    className="pointer-events-none absolute inset-0"
                    width={containerWidth}
                    height={renderedHeight}
                    viewBox={`0 0 ${containerWidth} ${renderedHeight}`}
                  >
                    {pageHighlights.map((item, itemIndex) => {
                      const scaleX = containerWidth / dimensions.width
                      const scaleY = renderedHeight / dimensions.height

                      return (
                        <rect
                          key={`${item.path}-${itemIndex}`}
                          x={item.x0 * scaleX}
                          y={item.y0 * scaleY}
                          width={(item.x1 - item.x0) * scaleX}
                          height={(item.y1 - item.y0) * scaleY}
                          fill="rgba(245, 158, 11, 0.28)"
                          stroke="rgba(245, 158, 11, 0.95)"
                          strokeWidth="1.5"
                          rx="2"
                        />
                      )
                    })}
                  </svg>
                )}
              </div>
            )
          })}
        </Document>
      </div>
    </div>
  )
}
