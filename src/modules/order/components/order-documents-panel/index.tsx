"use client"

import { useEffect, useState, useTransition } from "react"

import {
  downloadAccountDocument,
  downloadOrderDocumentDetailed,
  listOrderDocuments,
} from "@lib/data/order-documents"
import { convertToLocale } from "@lib/util/money"
import { formatTrackingDate } from "@modules/order-tracking/utils/format-tracking"
import type { CbaOrderDocument } from "types/order-documents"

type OrderDocumentsPanelProps = {
  documents?: CbaOrderDocument[]
  orderId?: string
}

function formatDocumentAmount(
  amountTotal: number | null,
  currencyCode: string
) {
  if (amountTotal == null) return "—"
  return convertToLocale({
    amount: amountTotal,
    currency_code: currencyCode || "lkr",
  })
}

function formatDocumentType(type: string) {
  if (type === "credit_note") return "Credit note"
  if (type === "invoice") return "Invoice"
  if (type === "receipt") return "Receipt"
  return type
    .split("_")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ")
}

function PanelDownloadButton({
  document,
  orderId,
}: {
  document: CbaOrderDocument
  orderId?: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!document.downloadable) {
    return <span className="text-[12px] text-[#5d6470]">Pending</span>
  }

  const onDownload = () => {
    if (pending) return
    setError(null)
    startTransition(async () => {
      if (orderId) {
        const result = await downloadOrderDocumentDetailed(orderId, document.id)
        if (!result.ok) {
          setError(result.message)
          return
        }
        window.open(result.download.url, "_blank", "noopener,noreferrer")
        return
      }

      const result = await downloadAccountDocument(document.id)
      if (!result?.url) {
        setError("Download failed")
        return
      }
      window.open(result.url, "_blank", "noopener,noreferrer")
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onDownload}
        disabled={pending}
        className="inline-flex rounded-md border border-[#e5e7eb] px-3 py-1.5 text-[12px] font-semibold text-[#151922] transition hover:border-[#ff5c0e] hover:text-[#ff5c0e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5c0e] disabled:cursor-not-allowed disabled:opacity-60"
        data-testid="order-document-download"
      >
        {pending ? "…" : "Download"}
      </button>
      {error && <span className="text-[11px] text-[#c62828]">{error}</span>}
    </div>
  )
}

export default function OrderDocumentsPanel({
  documents: initialDocuments,
  orderId,
}: OrderDocumentsPanelProps) {
  const [documents, setDocuments] = useState<CbaOrderDocument[]>(
    initialDocuments ?? []
  )
  const [loading, setLoading] = useState(
    Boolean(orderId && initialDocuments === undefined)
  )
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (initialDocuments !== undefined) {
      setDocuments(initialDocuments)
      setLoading(false)
      setLoadError(null)
      return
    }
    if (!orderId) {
      setDocuments([])
      setLoading(false)
      setLoadError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setLoadError(null)
    listOrderDocuments(orderId)
      .then((result) => {
        if (cancelled) return
        if (!result) {
          setDocuments([])
          setLoadError(
            "Could not load order documents. Verify your session and try again."
          )
          return
        }
        setDocuments(result.documents ?? [])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [initialDocuments, orderId])

  const issued = documents.filter(
    (doc) =>
      doc.status === "issued" &&
      (doc.document_type === "receipt" ||
        doc.document_type === "invoice" ||
        doc.document_type === "credit_note")
  )

  const sorted = [...issued].sort((a, b) => {
    const rank = (type: string) =>
      type === "receipt" ? 0 : type === "invoice" ? 1 : 2
    return rank(a.document_type) - rank(b.document_type)
  })

  return (
    <div className="flex flex-col gap-3" data-testid="order-documents-panel">
      <h3 className="text-[15px] font-semibold text-[#151922]">
        Order documents
      </h3>

      {loading ? (
        <p className="text-[13px] text-[#5d6470]">Loading documents…</p>
      ) : loadError ? (
        <p className="text-[13px] leading-6 text-[#c62828]">{loadError}</p>
      ) : !sorted.length ? (
        <p className="text-[13px] leading-6 text-[#5d6470]">
          No receipts, invoices, or credit notes are available for this order
          yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((doc) => (
            <li
              key={doc.id}
              className="flex items-start justify-between gap-3 border-t border-[#eeeeee] pt-3 first:border-t-0 first:pt-0"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[#151922]">
                  {doc.document_number ?? formatDocumentType(doc.document_type)}
                </p>
                <p className="mt-0.5 text-[12px] text-[#5d6470]">
                  {formatDocumentType(doc.document_type)}
                  {doc.issue_date || doc.issued_at
                    ? ` · ${formatTrackingDate(doc.issue_date ?? doc.issued_at)}`
                    : ""}
                </p>
                <p className="mt-0.5 text-[13px] font-medium text-[#151922]">
                  {formatDocumentAmount(doc.amount_total, doc.currency_code)}
                </p>
              </div>
              <PanelDownloadButton document={doc} orderId={orderId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
