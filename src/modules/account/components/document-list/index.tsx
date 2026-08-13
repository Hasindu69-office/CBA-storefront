"use client"

import { useMemo, useState, useTransition } from "react"

import { downloadAccountDocument } from "@lib/data/order-documents"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  formatOrderNumber,
  formatTrackingDate,
} from "@modules/order-tracking/utils/format-tracking"
import type {
  CbaOrderDocument,
  CbaOrderDocumentTypeFilter,
} from "types/order-documents"

type DocumentListProps = {
  documents: CbaOrderDocument[]
  loadError?: boolean
  initialType?: CbaOrderDocumentTypeFilter | "all"
}

const TYPE_FILTERS: Array<{
  value: CbaOrderDocumentTypeFilter | "all"
  label: string
}> = [
  { value: "all", label: "All" },
  { value: "receipt", label: "Receipts" },
  { value: "invoice", label: "Invoices" },
  { value: "credit_note", label: "Credit notes" },
]

function formatDocumentAmount(
  amountTotal: number | null,
  currencyCode: string
) {
  if (amountTotal == null) return "—"
  // amount_total is already in major currency units (same as Admin / PDF)
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

function DocumentDownloadButton({ document }: { document: CbaOrderDocument }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!document.downloadable) {
    return <span className="text-[13px] text-[#5d6470]">Unavailable</span>
  }

  const onDownload = () => {
    if (pending) return
    setError(null)
    startTransition(async () => {
      const result = await downloadAccountDocument(document.id)
      if (!result?.url) {
        setError("Download failed. Try again.")
        return
      }
      window.open(result.url, "_blank", "noopener,noreferrer")
    })
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onDownload}
        disabled={pending}
        className="inline-flex rounded-md bg-[#ff5c0e] px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#e6520c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5c0e] disabled:cursor-not-allowed disabled:opacity-60"
        data-testid="document-download-button"
      >
        {pending ? "Downloading…" : "Download"}
      </button>
      {error && <span className="text-[12px] text-[#c62828]">{error}</span>}
    </div>
  )
}

export default function DocumentList({
  documents,
  loadError = false,
  initialType = "all",
}: DocumentListProps) {
  const [activeType, setActiveType] = useState<
    CbaOrderDocumentTypeFilter | "all"
  >(initialType)

  const filtered = useMemo(() => {
    if (activeType === "all") return documents
    return documents.filter((doc) => doc.document_type === activeType)
  }, [activeType, documents])

  if (loadError) {
    return (
      <div className="rounded-[8px] border border-dashed border-[#d7dbe3] bg-[#fafbfc] px-5 py-10 text-center">
        <h2 className="text-[18px] font-semibold text-[#151922]">
          Unable to load documents
        </h2>
        <p className="mt-2 text-[14px] text-[#5d6470]">
          Please refresh the page or try again later.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5" data-testid="document-list">
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((filter) => {
          const active = activeType === filter.value
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveType(filter.value)}
              className={
                active
                  ? "inline-flex rounded-md bg-[#ff5c0e] px-3.5 py-2 text-[13px] font-semibold text-white"
                  : "inline-flex rounded-md border border-[#e5e7eb] px-3.5 py-2 text-[13px] font-semibold text-[#151922] transition hover:border-[#ff5c0e] hover:text-[#ff5c0e]"
              }
              data-testid={`document-filter-${filter.value}`}
            >
              {filter.label}
            </button>
          )
        })}
      </div>

      {!filtered.length ? (
        <div className="rounded-[8px] border border-dashed border-[#d7dbe3] bg-[#fafbfc] px-5 py-10 text-center">
          <h2 className="text-[18px] font-semibold text-[#151922]">
            No documents yet
          </h2>
          <p className="mt-2 text-[14px] text-[#5d6470]">
            Issued invoices and credit notes for your orders will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-[8px] border border-[#eeeeee] bg-white small:block">
            <table className="w-full text-left text-[14px]">
              <thead className="border-b border-[#eeeeee] bg-[#fafbfc] text-[12px] font-semibold uppercase tracking-wide text-[#8a919c]">
                <tr>
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-[#eeeeee] last:border-b-0"
                    data-testid="document-row"
                  >
                    <td className="px-4 py-4 font-semibold text-[#151922]">
                      {doc.document_number ?? doc.id}
                    </td>
                    <td className="px-4 py-4 text-[#5d6470]">
                      {formatDocumentType(doc.document_type)}
                    </td>
                    <td className="px-4 py-4">
                      <LocalizedClientLink
                        href={`/account/orders/details/${doc.order_id}`}
                        className="font-semibold text-[#ff5c0e] hover:underline"
                      >
                        {formatOrderNumber(doc.order_display_id)}
                      </LocalizedClientLink>
                    </td>
                    <td className="px-4 py-4 text-[#5d6470]">
                      {formatTrackingDate(doc.issue_date ?? doc.issued_at) ??
                        "—"}
                    </td>
                    <td className="px-4 py-4 font-medium text-[#151922]">
                      {formatDocumentAmount(
                        doc.amount_total,
                        doc.currency_code
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex justify-end">
                        <DocumentDownloadButton document={doc} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 small:hidden">
            {filtered.map((doc) => (
              <article
                key={doc.id}
                className="rounded-[8px] border border-[#eeeeee] bg-white p-5 shadow-[0_2px_12px_rgba(20,26,34,0.04)]"
                data-testid="document-card"
              >
                <div className="flex flex-col gap-3">
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#151922]">
                      {doc.document_number ?? doc.id}
                    </h2>
                    <p className="mt-1 text-[13px] text-[#5d6470]">
                      {formatDocumentType(doc.document_type)}
                    </p>
                  </div>
                  <p className="text-[13px] text-[#5d6470]">
                    Order{" "}
                    <LocalizedClientLink
                      href={`/account/orders/details/${doc.order_id}`}
                      className="font-semibold text-[#ff5c0e] hover:underline"
                    >
                      {formatOrderNumber(doc.order_display_id)}
                    </LocalizedClientLink>
                  </p>
                  <p className="text-[13px] text-[#5d6470]">
                    {formatTrackingDate(doc.issue_date ?? doc.issued_at) ?? "—"}
                  </p>
                  <p className="text-[14px] font-semibold text-[#151922]">
                    {formatDocumentAmount(doc.amount_total, doc.currency_code)}
                  </p>
                  <DocumentDownloadButton document={doc} />
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
