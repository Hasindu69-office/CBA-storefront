export function formatOrderNumber(displayId: number | string | null | undefined) {
  if (displayId === null || displayId === undefined || displayId === "") {
    return "Order"
  }
  return `CBA-${displayId}`
}

export function primaryTrackingLabel(
  fulfillments: Array<{
    labels: Array<{
      tracking_number?: string | null
      tracking_url?: string | null
    }>
  }>
) {
  for (const fulfillment of fulfillments) {
    for (const label of fulfillment.labels) {
      if (label.tracking_number?.trim()) {
        return label
      }
    }
  }
  return null
}

export function formatTrackingDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export type HorizontalTimelineStep = {
  id: string
  label: string
  description: string | null
  occurred_at: string | null
  state: "complete" | "current" | "upcoming" | "cancelled" | "failed"
}

const HORIZONTAL_MACRO_STEPS: Array<{
  id: string
  label: string
  keys: string[]
}> = [
  { id: "placed", label: "Order placed", keys: ["order_placed"] },
  {
    id: "confirmed",
    label: "Confirmed",
    keys: ["payment_confirmed", "processing"],
  },
  {
    id: "shipped",
    label: "Shipped",
    keys: [
      "ready_for_dispatch",
      "packed",
      "shipped",
      "in_transit",
      "out_for_delivery",
    ],
  },
  { id: "delivered", label: "Delivered", keys: ["delivered"] },
]

function aggregateStepState(
  matches: Array<{ state: HorizontalTimelineStep["state"] }>
): HorizontalTimelineStep["state"] {
  if (!matches.length) return "upcoming"
  if (matches.some((item) => item.state === "cancelled")) return "cancelled"
  if (matches.some((item) => item.state === "failed")) return "failed"
  if (matches.some((item) => item.state === "current")) return "current"
  if (matches.every((item) => item.state === "complete")) return "complete"
  if (matches.some((item) => item.state === "complete")) return "current"
  return "upcoming"
}

/**
 * Collapse the full vertical timeline into a standard 4-step horizontal stepper.
 */
export function deriveHorizontalTimelineSteps(
  items: Array<{
    key: string
    title: string
    description: string | null
    occurred_at: string
    state: HorizontalTimelineStep["state"]
  }>
): HorizontalTimelineStep[] {
  if (!items.length) return []

  const hasCancelled = items.some((item) => item.state === "cancelled")
  if (hasCancelled) {
    const cancelled = items.find((item) => item.state === "cancelled")
    return [
      {
        id: "cancelled",
        label: cancelled?.title ?? "Cancelled",
        description: cancelled?.description ?? null,
        occurred_at: cancelled?.occurred_at ?? null,
        state: "cancelled",
      },
    ]
  }

  return HORIZONTAL_MACRO_STEPS.map((macro) => {
    const matches = items.filter((item) => macro.keys.includes(item.key))
    const state = aggregateStepState(matches)
    const latest = [...matches]
      .filter((item) => item.state === "complete" || item.state === "current")
      .sort(
        (left, right) =>
          new Date(right.occurred_at).getTime() -
          new Date(left.occurred_at).getTime()
      )[0]

    return {
      id: macro.id,
      label: macro.label,
      description: latest?.description ?? matches[0]?.description ?? null,
      occurred_at:
        latest?.occurred_at && latest.state !== "upcoming"
          ? latest.occurred_at
          : null,
      state,
    }
  })
}

export function currentTimelineHighlight(
  items: Array<{
    title: string
    description: string | null
    state: HorizontalTimelineStep["state"]
  }>,
  nextStepTitle?: string | null
) {
  const current =
    [...items].reverse().find((item) => item.state === "current") ??
    [...items].reverse().find((item) => item.state === "complete")

  if (current) {
    return {
      title: current.title,
      description: current.description,
      nextLabel: nextStepTitle ?? null,
    }
  }

  return {
    title: "Order received",
    description: "We are preparing your order updates.",
    nextLabel: nextStepTitle ?? null,
  }
}

export function formatStatusLabel(value?: string | null) {
  if (!value) return "Unknown"
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ")
}

export function statusBadgeTone(
  kind: "payment" | "fulfillment" | "order" | "shipment",
  key?: string | null
) {
  const normalized = String(key ?? "").toLowerCase()
  if (kind === "payment" && normalized.includes("refund")) {
    return "success" as const
  }
  if (
    normalized.includes("cancel") ||
    normalized.includes("fail")
  ) {
    return "danger" as const
  }
  if (
    normalized.includes("deliver") ||
    normalized.includes("captured") ||
    normalized === "complete" ||
    normalized === "completed" ||
    normalized.includes("refund")
  ) {
    return "success" as const
  }
  if (
    normalized.includes("ship") ||
    normalized.includes("transit") ||
    normalized.includes("dispatch")
  ) {
    return "brand" as const
  }
  if (kind === "payment" && normalized.includes("pending")) {
    return "warning" as const
  }
  return "neutral" as const
}

export function isSafeExternalUrl(value?: string | null) {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

export function validateGuestLookupClient(input: {
  order_reference: string
  email: string
  phone: string
}) {
  const order_reference = input.order_reference.trim().slice(0, 64)
  const email = input.email.trim().toLowerCase().slice(0, 254)
  const phone = input.phone.trim().slice(0, 20)
  const errors: Record<string, string> = {}

  if (!order_reference) {
    errors.order_reference = "Order or tracking number is required."
  } else if (/[\u0000-\u001f\u007f]/.test(order_reference)) {
    errors.order_reference = "Order or tracking number contains invalid characters."
  }

  if (!email && !phone) {
    errors.email = "Enter the email or phone used on the order."
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address."
  }
  if (phone && phone.replace(/\D/g, "").length < 9) {
    errors.phone = "Enter a valid phone number."
  }

  return {
    ok: Object.keys(errors).length === 0,
    values: { order_reference, email, phone },
    errors,
  }
}

export function validateOtpClient(code: string) {
  const trimmed = code.trim()
  if (!/^\d{6}$/.test(trimmed)) {
    return { ok: false as const, error: "Enter the 6-digit code." }
  }
  return { ok: true as const, code: trimmed }
}
