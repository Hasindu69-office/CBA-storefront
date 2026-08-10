"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  cancelReturnIntakeRequest,
  getReturnIntakeRequest,
  uploadRequestEvidence,
} from "@lib/data/return-intake"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import EvidenceUploader from "@modules/return-intake/components/evidence-uploader"
import {
  DEFAULT_UPLOAD_POLICY,
  evidenceTypeFromMime,
  fileToBase64,
  formatBytes,
  revokePreviewUrls,
  type StagedEvidenceItem,
} from "@modules/return-intake/lib/evidence"
import type { CbaReturnIntakeDetail } from "types/return-intake"

type Props = {
  initialRequest: CbaReturnIntakeDetail
}

const CANCELABLE = new Set([
  "submitted",
  "under_review",
  "information_required",
  "approved",
])

export default function ReturnIntakeDetailTemplate({ initialRequest }: Props) {
  const router = useRouter()
  const [request, setRequest] = useState(initialRequest)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [followUp, setFollowUp] = useState<StagedEvidenceItem[]>([])
  const [uploading, setUploading] = useState(false)
  const filesRef = useRef<Map<string, File>>(new Map())

  useEffect(() => {
    return () => {
      revokePreviewUrls(followUp)
      filesRef.current.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isResolved =
    request.status === "resolved" || request.status === "closed"
  const isRefundIssued =
    request.resolution_outcome === "refund_issued" ||
    (isResolved &&
      ["return", "refund_review", "claim_refund", "cancellation"].includes(
        request.request_type
      ))
  const canCancel = CANCELABLE.has(request.status)
  const needsInfo = request.status === "information_required"

  function addFiles(files: File[]) {
    const additions: StagedEvidenceItem[] = files.map((file) => {
      const id = `local-${crypto.randomUUID()}`
      filesRef.current.set(id, file)
      const contentType = (file.type || "").toLowerCase().split(";")[0].trim()
      return {
        id,
        original_file_name: file.name,
        content_type: contentType,
        size_bytes: file.size,
        evidence_type: evidenceTypeFromMime(contentType),
        previewUrl: contentType.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
      }
    })
    setFollowUp((prev) => [...prev, ...additions])
  }

  function removeFollowUp(id: string) {
    setFollowUp((prev) => {
      const target = prev.find((item) => item.id === id)
      if (target?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((item) => item.id !== id)
    })
    filesRef.current.delete(id)
  }

  function onCancel() {
    if (
      !window.confirm(
        "Cancel this request? You can submit a new one later if needed."
      )
    ) {
      return
    }
    startTransition(async () => {
      setError(null)
      try {
        const result = await cancelReturnIntakeRequest(request.request_no)
        setRequest(result.request)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to cancel.")
      }
    })
  }

  function onUploadFollowUp() {
    if (!followUp.length) {
      setError("Choose at least one file to upload.")
      return
    }
    startTransition(async () => {
      setError(null)
      setUploading(true)
      try {
        for (const item of followUp) {
          const file = filesRef.current.get(item.id)
          if (!file) continue
          const content_base64 = await fileToBase64(file)
          await uploadRequestEvidence(request.request_no, {
            original_file_name: item.original_file_name,
            content_type: item.content_type,
            size_bytes: item.size_bytes,
            evidence_type: item.evidence_type,
            content_base64,
          })
        }
        revokePreviewUrls(followUp)
        filesRef.current.clear()
        setFollowUp([])
        const refreshed = await getReturnIntakeRequest(request.request_no)
        setRequest(refreshed.request)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.")
      } finally {
        setUploading(false)
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <LocalizedClientLink
        href="/account/returns"
        className="text-[13px] font-semibold text-[#5d6470] hover:text-[#ff5c0e]"
      >
        Back to return requests
      </LocalizedClientLink>

      <div className="rounded-[8px] border border-[#eeeeee] bg-white p-6 shadow-[0_2px_12px_rgba(20,26,34,0.04)]">
        <h1 className="text-[24px] font-bold text-[#151922]">
          {request.request_no}
        </h1>
        <p className="mt-2 text-[14px] text-[#5d6470]">
          {request.status_label} · {request.request_type}
        </p>

        {isResolved && (
          <div
            className={`mt-4 rounded-md p-4 text-[14px] ${
              isRefundIssued
                ? "bg-[#eefaf3] text-[#146c43]"
                : "bg-[#f3f4f6] text-[#151922]"
            }`}
          >
            {request.customer_visible_note ??
              (isRefundIssued
                ? "Refund issued. Your request is complete."
                : "Your request has been completed.")}
          </div>
        )}

        {!isResolved && request.customer_visible_note && (
          <div className="mt-4 rounded-md bg-[#fff4ee] p-4 text-[14px] text-[#9a3d0a]">
            {request.customer_visible_note}
          </div>
        )}

        {!isResolved && request.next_action && (
          <p className="mt-4 text-[14px] text-[#151922]">{request.next_action}</p>
        )}

        {error && <p className="mt-4 text-[13px] text-rose-600">{error}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          <LocalizedClientLink
            href={`/account/orders/details/${request.order_id}`}
            className="inline-flex items-center justify-center rounded-md border border-[#e5e7eb] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#151922] transition hover:border-[#ff5c0e] hover:text-[#ff5c0e]"
          >
            View order tracking
          </LocalizedClientLink>
          {canCancel && (
            <button
              type="button"
              disabled={pending}
              onClick={onCancel}
              className="inline-flex items-center justify-center rounded-md border border-[#e5e7eb] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#5d6470] transition hover:border-rose-400 hover:text-rose-600 disabled:opacity-60"
            >
              {pending ? "Cancelling…" : "Cancel request"}
            </button>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-[16px] font-semibold text-[#151922]">Items</h2>
          <ul className="mt-2 space-y-2">
            {request.items.map((item) => (
              <li
                key={item.order_item_id}
                className="text-[14px] text-[#5d6470]"
              >
                {item.quantity_requested} × {item.title}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <h2 className="text-[16px] font-semibold text-[#151922]">Evidence</h2>
          {request.evidence?.length ? (
            <ul className="mt-2 space-y-2">
              {request.evidence.map((item) => (
                <li
                  key={item.id}
                  className="rounded-md border border-[#e5e7eb] px-3 py-2 text-[13px] text-[#5d6470]"
                >
                  {item.original_file_name} · {formatBytes(item.size_bytes)} ·{" "}
                  {item.evidence_type}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[13px] text-[#5d6470]">No files attached.</p>
          )}
        </div>

        {needsInfo && (
          <div className="mt-6 rounded-md border border-[#ffd7bf] bg-[#fff4ee] p-4">
            <h2 className="text-[16px] font-semibold text-[#151922]">
              Additional information requested
            </h2>
            <p className="mt-1 text-[13px] text-[#5d6470]">
              Upload photos or documents to help us continue reviewing your
              request.
            </p>
            <div className="mt-4">
              <EvidenceUploader
                policy={DEFAULT_UPLOAD_POLICY}
                required
                items={followUp}
                uploading={uploading || pending}
                onAddFiles={addFiles}
                onRemove={removeFollowUp}
                disabled={pending || uploading}
              />
            </div>
            <button
              type="button"
              disabled={pending || uploading || !followUp.length}
              onClick={onUploadFollowUp}
              className="mt-4 rounded-md bg-[#ff5c0e] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#e6520c] disabled:opacity-60"
            >
              {uploading ? "Uploading…" : "Upload additional evidence"}
            </button>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-[16px] font-semibold text-[#151922]">Timeline</h2>
          <ul className="mt-2 space-y-2">
            {request.timeline.map((event, index) => (
              <li
                key={`${event.event_type}-${index}`}
                className="text-[13px] text-[#5d6470]"
              >
                {event.created_at
                  ? new Date(event.created_at).toLocaleString()
                  : ""}{" "}
                — {event.message ?? event.event_type}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
