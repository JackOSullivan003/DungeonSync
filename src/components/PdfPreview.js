'use client'

import { useEffect, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

function base64ToBlobUrl(base64) {
  const cleanBase64 = base64.includes(',')
    ? base64.split(',').pop()
    : base64

  const binary = atob(cleanBase64)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  const blob = new Blob([bytes], { type: 'application/pdf' })
  return URL.createObjectURL(blob)
}

export default function PdfPreview({ currentFileId }) {
  const [pdfUrl, setPdfUrl] = useState(null)
  const [title, setTitle] = useState('')
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentFileId) return

    let objectUrl = null
    let cancelled = false

    async function loadPdf() {
      setPdfUrl(null)
      setError('')
      setPageNumber(1)
      setNumPages(null)

      try {
        const res = await fetch(`/api/files/${currentFileId}`)
        const file = await res.json()

        if (!res.ok) {
          throw new Error(file.error || 'Failed to load PDF')
        }

        objectUrl = base64ToBlobUrl(file.content || '')

        if (!cancelled) {
          setTitle(file.title || 'PDF preview')
          setPdfUrl(objectUrl)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load PDF')
        }
      }
    }

    loadPdf()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [currentFileId])

  if (!currentFileId) {
    return <div className="pdf-preview-empty">Select a PDF to preview</div>
  }

  if (error) {
    return <div className="pdf-preview-empty">{error}</div>
  }

  return (
    <div className="pdf-preview">
      <div className="pdf-preview-toolbar">
        <strong>{title}</strong>

        <button
          onClick={() => setPageNumber(page => Math.max(1, page - 1))}
          disabled={pageNumber <= 1}
        >
          Previous
        </button>

        <span>
          Page {pageNumber} of {numPages || '?'}
        </span>

        <button
          onClick={() => setPageNumber(page => Math.min(numPages || page, page + 1))}
          disabled={numPages ? pageNumber >= numPages : true}
        >
          Next
        </button>

        <button onClick={() => setScale(value => Math.max(0.6, value - 0.1))}>
          -
        </button>

        <button onClick={() => setScale(value => Math.min(2, value + 0.1))}>
          +
        </button>
      </div>

      <div className="pdf-preview-body">
        {pdfUrl ? (
          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={<div className="pdf-preview-empty">Loading PDF...</div>}
            error={<div className="pdf-preview-empty">Could not display PDF.</div>}
          >
            <Page pageNumber={pageNumber} scale={scale} />
          </Document>
        ) : (
          <div className="pdf-preview-empty">Loading PDF...</div>
        )}
      </div>
    </div>
  )
}
