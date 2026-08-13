import type { CbaReturnIntakeRequestType } from "types/return-intake"

import {
  evidenceStepVisible,
  validateEvidenceStepClient,
} from "./evidence"

export type ReturnIntakeFormValues = {
  request_type: CbaReturnIntakeRequestType | ""
  reason_code: string
  message: string
  preferred_resolution: string
  items: Record<string, { selected: boolean; quantity: number; note: string }>
}

export type FieldErrors = Record<string, string>

export type WizardStep = "type" | "items" | "details" | "evidence" | "review"

export function validateReturnIntakeStep(
  step: WizardStep,
  values: ReturnIntakeFormValues,
  maxByItem: Record<string, number>,
  options?: {
    evidenceCount?: number
    evidenceRequired?: boolean
  }
): { ok: boolean; errors: FieldErrors } {
  const errors: FieldErrors = {}

  if (
    step === "type" ||
    step === "items" ||
    step === "details" ||
    step === "evidence" ||
    step === "review"
  ) {
    if (!values.request_type) {
      errors.request_type = "Select a request type."
    }
  }

  if (step === "items" || step === "details" || step === "evidence" || step === "review") {
    const selected = Object.entries(values.items).filter(([, row]) => row.selected)
    if (!selected.length) {
      errors.items = "Select at least one item."
    }
    for (const [orderItemId, row] of selected) {
      const max = maxByItem[orderItemId] ?? 0
      if (row.quantity < 1) errors[`qty_${orderItemId}`] = "Quantity must be at least 1."
      if (row.quantity > max) errors[`qty_${orderItemId}`] = `Maximum quantity is ${max}.`
    }
  }

  if (step === "details" || step === "evidence" || step === "review") {
    if (!values.reason_code.trim()) errors.reason_code = "Select or enter a reason."
    if (values.message.trim().length > 4000) errors.message = "Message is too long."
  }

  if (
    (step === "evidence" || step === "review") &&
    evidenceStepVisible(values.request_type)
  ) {
    const evidenceCheck = validateEvidenceStepClient(
      values.request_type,
      options?.evidenceCount ?? 0,
      options?.evidenceRequired
    )
    if (!evidenceCheck.ok && evidenceCheck.error) {
      errors.evidence = evidenceCheck.error
    }
  }

  return { ok: Object.keys(errors).length === 0, errors }
}

export const REQUEST_TYPE_OPTIONS: Array<{
  value: CbaReturnIntakeRequestType
  label: string
  description: string
}> = [
  {
    value: "return",
    label: "Return",
    description: "Return delivered item(s) for review.",
  },
  {
    value: "exchange",
    label: "Exchange",
    description: "Request a replacement or different variant.",
  },
  {
    value: "refund_review",
    label: "Refund review",
    description: "Request a refund review (approval required).",
  },
  {
    value: "claim_refund",
    label: "Defective / incorrect item (refund)",
    description: "Report a defective or wrong item.",
  },
  {
    value: "claim_replace",
    label: "Defective / incorrect item (replacement)",
    description: "Request a replacement for a defective or wrong item.",
  },
  {
    value: "warranty",
    label: "Warranty support",
    description: "Submit a warranty service request.",
  },
  {
    value: "cancellation",
    label: "Cancellation",
    description: "Request order cancellation (if not yet fulfilled).",
  },
]
