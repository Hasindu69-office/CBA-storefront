"use client"

import {
  downloadOrderDocumentDetailed,
  getOrderReceiptForDownload,
} from "@lib/data/order-documents"
import { useCallback, useEffect, useState, useTransition } from "react"

type DownloadReceiptButtonProps = {
  orderId: string
}

export default function DownloadReceiptButton({
  orderId,
}: DownloadReceiptButtonProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [receiptId, setReceiptId] = useState<string | null>(null)

  const refreshReceipt = useCallback(async () => {
    const result = await getOrderReceiptForDownload(orderId)
    if (result.status === "ready") {
      setReceiptId(result.receipt.id)
      setReady(true)
      setError(null)
      return true
    }
    setReady(false)
    if (result.status === "error") {
      setError(result.message)
    }
    return false
  }, [orderId])

  useEffect(() => {
    let cancelled = false
    let attempts = 0

    const poll = async () => {
      if (cancelled) return
      const found = await refreshReceipt()
      if (found || cancelled) return
      attempts += 1
      if (attempts < 4) {
        window.setTimeout(poll, 1500)
      }
    }

    void poll()
    return () => {
      cancelled = true
    }
  }, [refreshReceipt])

  const onDownload = () => {
    setError(null)
    startTransition(async () => {
      let documentId = receiptId
      if (!documentId) {
        const lookup = await getOrderReceiptForDownload(orderId)
        if (lookup.status === "ready") {
          documentId = lookup.receipt.id
          setReceiptId(documentId)
          setReady(true)
        } else {
          setError(lookup.message)
          return
        }
      }

      const download = await downloadOrderDocumentDetailed(orderId, documentId)
      if (!download.ok) {
        setError(download.message)
        return
      }
      window.open(download.download.url, "_blank", "noopener,noreferrer")
    })
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={onDownload}
        disabled={pending}
        className="inline-flex h-14 items-center justify-center gap-3 rounded-[8px] bg-brand text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
        data-testid="download-receipt-button"
      >
        {pending ? "Preparing…" : "Download Receipt"}
      </button>
      {error ? (
        <p
          className="text-center text-[13px] leading-5 text-[#b45309]"
          data-testid="download-receipt-error"
        >
          {error}
        </p>
      ) : !ready ? (
        <p className="text-center text-[12px] text-[#6b7280]">
          Receipt PDF is also attached to your confirmation email.
        </p>
      ) : null}
    </div>
  )
}
