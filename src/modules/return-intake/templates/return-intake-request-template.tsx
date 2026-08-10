"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  previewReturnIntakeEligibility,
  submitReturnIntakeRequest,
  uploadReturnIntakeEvidence,
} from "@lib/data/return-intake"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import EvidenceUploader from "@modules/return-intake/components/evidence-uploader"
import {
  DEFAULT_UPLOAD_POLICY,
  evidenceRequiredForType,
  evidenceStepVisible,
  evidenceTypeFromMime,
  fileToBase64,
  revokePreviewUrls,
  type EvidenceUploadPolicy,
  type StagedEvidenceItem,
} from "@modules/return-intake/lib/evidence"
import {
  REQUEST_TYPE_OPTIONS,
  validateReturnIntakeStep,
  type ReturnIntakeFormValues,
  type WizardStep,
} from "@modules/return-intake/lib/validation"
import type { CbaCustomerOrderTracking } from "types/order-tracking"
import type {
  CbaReturnEligibility,
  CbaReturnIntakeRequestType,
} from "types/return-intake"

type Props = {
  tracking: CbaCustomerOrderTracking
  returnEligibility?: CbaReturnEligibility
}

const BASE_STEPS: WizardStep[] = ["type", "items", "details", "evidence", "review"]

export default function ReturnIntakeRequestTemplate({
  tracking,
  returnEligibility,
}: Props) {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [uploadPolicy, setUploadPolicy] =
    useState<EvidenceUploadPolicy>(DEFAULT_UPLOAD_POLICY)
  const [evidenceRequired, setEvidenceRequired] = useState(false)
  const [stagedEvidence, setStagedEvidence] = useState<StagedEvidenceItem[]>([])
  const [uploading, setUploading] = useState(false)
  const stagingTokenRef = useRef(crypto.randomUUID())
  const filesByLocalIdRef = useRef<Map<string, File>>(new Map())

  const maxByItem = useMemo(() => {
    const map: Record<string, number> = {}
    for (const item of returnEligibility?.item_eligibility ?? []) {
      map[item.order_item_id] = item.max_quantity
    }
    for (const item of tracking.items) {
      if (map[item.id] == null) map[item.id] = item.quantity
    }
    return map
  }, [returnEligibility, tracking.items])

  const [values, setValues] = useState<ReturnIntakeFormValues>(() => ({
    request_type: "",
    reason_code: "",
    message: "",
    preferred_resolution: "",
    items: Object.fromEntries(
      tracking.items.map((item) => [
        item.id,
        { selected: false, quantity: 1, note: "" },
      ])
    ),
  }))

  const steps = useMemo(() => {
    if (!evidenceStepVisible(values.request_type)) {
      return BASE_STEPS.filter((s) => s !== "evidence")
    }
    return BASE_STEPS
  }, [values.request_type])

  useEffect(() => {
    setStepIndex((current) => Math.min(current, steps.length - 1))
  }, [steps.length])

  const step = steps[Math.min(stepIndex, steps.length - 1)]

  useEffect(() => {
    return () => {
      revokePreviewUrls(stagedEvidence)
      filesByLocalIdRef.current.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup on unmount only
  }, [])

  useEffect(() => {
    setEvidenceRequired(evidenceRequiredForType(values.request_type))
  }, [values.request_type])

  function clearEvidence() {
    revokePreviewUrls(stagedEvidence)
    filesByLocalIdRef.current.clear()
    setStagedEvidence([])
  }

  function addFiles(files: File[]) {
    const additions: StagedEvidenceItem[] = files.map((file) => {
      const localId = `local-${crypto.randomUUID()}`
      filesByLocalIdRef.current.set(localId, file)
      const contentType = (file.type || "").toLowerCase().split(";")[0].trim()
      return {
        id: localId,
        original_file_name: file.name,
        content_type: contentType,
        size_bytes: file.size,
        evidence_type: evidenceTypeFromMime(contentType),
        previewUrl: contentType.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
      }
    })
    setStagedEvidence((prev) => [...prev, ...additions])
  }

  function removeEvidence(id: string) {
    setStagedEvidence((prev) => {
      const target = prev.find((item) => item.id === id)
      if (target?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((item) => item.id !== id)
    })
    filesByLocalIdRef.current.delete(id)
  }

  async function refreshEligibility() {
    if (!values.request_type) return
    const items = Object.entries(values.items)
      .filter(([, row]) => row.selected)
      .map(([order_item_id, row]) => ({
        order_item_id,
        quantity: row.quantity,
      }))
    if (!items.length) return
    try {
      const result = await previewReturnIntakeEligibility({
        order_id: tracking.order.id,
        request_type: values.request_type as CbaReturnIntakeRequestType,
        items,
      })
      if (result.eligibility.upload_policy) {
        setUploadPolicy({
          max_files: result.eligibility.upload_policy.max_files,
          max_file_bytes: result.eligibility.upload_policy.max_file_bytes,
          max_total_bytes: result.eligibility.upload_policy.max_total_bytes,
          allowed_types: result.eligibility.upload_policy.allowed_types,
        })
      }
      if (typeof result.eligibility.evidence_required === "boolean") {
        setEvidenceRequired(result.eligibility.evidence_required)
      } else {
        setEvidenceRequired(
          (result.eligibility.evidence_requirements ?? []).includes(
            "photo_or_document"
          ) || evidenceRequiredForType(values.request_type)
        )
      }
    } catch {
      // Client fallbacks remain; server enforces on submit.
    }
  }

  function nextStep() {
    const result = validateReturnIntakeStep(step, values, maxByItem, {
      evidenceCount: stagedEvidence.length,
      evidenceRequired,
    })
    setFieldErrors(result.errors)
    if (!result.ok) return

    if (step === "items") {
      void refreshEligibility()
    }

    setStepIndex((current) => Math.min(current + 1, steps.length - 1))
  }

  async function uploadPendingEvidence(): Promise<string[]> {
    const stagingToken = stagingTokenRef.current
    const alreadyUploaded = stagedEvidence.filter(
      (item) => !item.id.startsWith("local-")
    )
    const ids = alreadyUploaded.map((item) => item.id)
    const pendingLocals = stagedEvidence.filter((item) =>
      item.id.startsWith("local-")
    )
    const uploadedMeta: StagedEvidenceItem[] = []

    for (const item of pendingLocals) {
      const file = filesByLocalIdRef.current.get(item.id)
      if (!file) {
        throw new Error("A selected file could not be read. Please re-add it.")
      }
      const content_base64 = await fileToBase64(file)
      const response = await uploadReturnIntakeEvidence({
        order_id: tracking.order.id,
        original_file_name: item.original_file_name,
        content_type: item.content_type,
        size_bytes: item.size_bytes,
        evidence_type: item.evidence_type,
        staging_token: stagingToken,
        content_base64,
      })
      ids.push(response.evidence.id)
      filesByLocalIdRef.current.delete(item.id)
      if (item.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(item.previewUrl)
      }
      uploadedMeta.push({
        ...item,
        id: response.evidence.id,
        previewUrl: null,
      })
    }

    if (pendingLocals.length) {
      setStagedEvidence([...alreadyUploaded, ...uploadedMeta])
    }

    return ids
  }

  function submit() {
    const result = validateReturnIntakeStep("review", values, maxByItem, {
      evidenceCount: stagedEvidence.length,
      evidenceRequired,
    })
    setFieldErrors(result.errors)
    if (!result.ok || !values.request_type) return

    startTransition(async () => {
      setError(null)
      setUploading(true)
      try {
        const items = Object.entries(values.items)
          .filter(([, row]) => row.selected)
          .map(([order_item_id, row]) => ({
            order_item_id,
            quantity: row.quantity,
            note: row.note || undefined,
          }))

        await previewReturnIntakeEligibility({
          order_id: tracking.order.id,
          request_type: values.request_type as CbaReturnIntakeRequestType,
          items,
        })

        let evidenceIds: string[] = []
        if (evidenceStepVisible(values.request_type) && stagedEvidence.length) {
          evidenceIds = await uploadPendingEvidence()
        }

        const response = await submitReturnIntakeRequest({
          order_id: tracking.order.id,
          request_type: values.request_type as CbaReturnIntakeRequestType,
          reason_code: values.reason_code,
          message: values.message,
          preferred_resolution: values.preferred_resolution || undefined,
          items,
          evidence_ids: evidenceIds,
          staging_token: stagingTokenRef.current,
          idempotency_key: crypto.randomUUID(),
        })

        clearEvidence()
        router.push(
          `/account/returns/${encodeURIComponent(response.request.request_no)}`
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : "Submission failed.")
      } finally {
        setUploading(false)
      }
    })
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <LocalizedClientLink
        href={`/account/orders/details/${tracking.order.id}`}
        className="text-[13px] font-semibold text-[#5d6470] hover:text-[#ff5c0e]"
      >
        Back to order
      </LocalizedClientLink>

      <div className="rounded-[8px] border border-[#eeeeee] bg-white p-6 shadow-[0_2px_12px_rgba(20,26,34,0.04)]">
        <h1 className="text-[24px] font-bold text-[#151922]">
          Post-purchase request
        </h1>
        <p className="mt-2 text-[14px] text-[#5d6470]">
          {returnEligibility?.disclaimer ??
            "Submitting a request does not guarantee approval."}
        </p>

        <p className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-[#8a919c]">
          Step {stepIndex + 1} of {steps.length}
        </p>

        {step === "type" && (
          <div className="mt-6 flex flex-col gap-3">
            {REQUEST_TYPE_OPTIONS.filter((option) =>
              (
                returnEligibility?.actions ??
                REQUEST_TYPE_OPTIONS.map((o) => o.value)
              ).includes(option.value)
            ).map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-md border p-4 ${
                  values.request_type === option.value
                    ? "border-[#ff5c0e] bg-[#fff4ee]"
                    : "border-[#e5e7eb]"
                }`}
              >
                <input
                  type="radio"
                  name="request_type"
                  className="sr-only"
                  checked={values.request_type === option.value}
                  onChange={() => {
                    if (
                      values.request_type &&
                      values.request_type !== option.value
                    ) {
                      clearEvidence()
                      stagingTokenRef.current = crypto.randomUUID()
                    }
                    setValues((prev) => ({
                      ...prev,
                      request_type: option.value,
                    }))
                  }}
                />
                <p className="font-semibold text-[#151922]">{option.label}</p>
                <p className="text-[13px] text-[#5d6470]">{option.description}</p>
              </label>
            ))}
            {fieldErrors.request_type && (
              <p className="text-[13px] text-rose-600">
                {fieldErrors.request_type}
              </p>
            )}
          </div>
        )}

        {step === "items" && (
          <div className="mt-6 flex flex-col gap-4">
            {tracking.items.map((item) => {
              const row = values.items[item.id]
              const max = maxByItem[item.id] ?? item.quantity
              return (
                <div
                  key={item.id}
                  className="rounded-md border border-[#e5e7eb] p-4"
                >
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={row?.selected ?? false}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          items: {
                            ...prev.items,
                            [item.id]: {
                              ...prev.items[item.id],
                              selected: e.target.checked,
                            },
                          },
                        }))
                      }
                    />
                    <span>
                      <span className="font-semibold text-[#151922]">
                        {item.title}
                      </span>
                      {item.variant_title && (
                        <span className="block text-[13px] text-[#5d6470]">
                          {item.variant_title}
                        </span>
                      )}
                    </span>
                  </label>
                  {row?.selected && (
                    <div className="mt-3">
                      <label className="text-[13px] text-[#5d6470]">
                        Quantity (max {max})
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={max}
                        value={row.quantity}
                        onChange={(e) =>
                          setValues((prev) => ({
                            ...prev,
                            items: {
                              ...prev.items,
                              [item.id]: {
                                ...prev.items[item.id],
                                quantity: Number(e.target.value),
                              },
                            },
                          }))
                        }
                        className="mt-1 w-24 rounded-md border border-[#e5e7eb] px-3 py-2 text-[14px]"
                      />
                      {fieldErrors[`qty_${item.id}`] && (
                        <p className="text-[12px] text-rose-600">
                          {fieldErrors[`qty_${item.id}`]}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            {fieldErrors.items && (
              <p className="text-[13px] text-rose-600">{fieldErrors.items}</p>
            )}
          </div>
        )}

        {step === "details" && (
          <div className="mt-6 flex flex-col gap-4">
            <div>
              <label className="text-[13px] font-medium text-[#151922]">
                Reason
              </label>
              <input
                value={values.reason_code}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    reason_code: e.target.value,
                  }))
                }
                className="mt-1 w-full rounded-md border border-[#e5e7eb] px-3 py-2.5 text-[14px]"
                placeholder="e.g. defective, wrong item, changed mind"
              />
              {fieldErrors.reason_code && (
                <p className="text-[12px] text-rose-600">
                  {fieldErrors.reason_code}
                </p>
              )}
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#151922]">
                Message
              </label>
              <textarea
                value={values.message}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, message: e.target.value }))
                }
                rows={5}
                className="mt-1 w-full rounded-md border border-[#e5e7eb] px-3 py-2.5 text-[14px]"
                placeholder="Describe the issue and what you need."
              />
            </div>
          </div>
        )}

        {step === "evidence" && (
          <div className="mt-6">
            <EvidenceUploader
              policy={uploadPolicy}
              required={evidenceRequired}
              items={stagedEvidence}
              uploading={uploading}
              error={fieldErrors.evidence}
              onAddFiles={addFiles}
              onRemove={removeEvidence}
              disabled={pending}
            />
          </div>
        )}

        {step === "review" && (
          <div className="mt-6 space-y-3 text-[14px] text-[#151922]">
            <p>
              <strong>Type:</strong> {values.request_type}
            </p>
            <p>
              <strong>Reason:</strong> {values.reason_code}
            </p>
            <p>
              <strong>Message:</strong> {values.message || "—"}
            </p>
            {evidenceStepVisible(values.request_type) && (
              <p>
                <strong>Evidence:</strong>{" "}
                {stagedEvidence.length
                  ? `${stagedEvidence.length} file(s)`
                  : evidenceRequired
                    ? "Required — none attached"
                    : "None (optional)"}
              </p>
            )}
            {error && <p className="text-rose-600">{error}</p>}
            {fieldErrors.evidence && (
              <p className="text-rose-600">{fieldErrors.evidence}</p>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={() => setStepIndex((i) => i - 1)}
              className="rounded-md border border-[#e5e7eb] px-5 py-2.5 text-[14px] font-semibold"
            >
              Back
            </button>
          )}
          {step !== "review" ? (
            <button
              type="button"
              onClick={nextStep}
              className="rounded-md bg-[#ff5c0e] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#e6520c]"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={pending || uploading}
              onClick={submit}
              className="rounded-md bg-[#ff5c0e] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#e6520c] disabled:opacity-60"
            >
              {pending || uploading ? "Submitting..." : "Submit request"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
