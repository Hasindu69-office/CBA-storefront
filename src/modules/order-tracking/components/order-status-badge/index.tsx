import { statusBadgeTone, formatStatusLabel } from "../../utils/format-tracking"

const TONE_CLASS: Record<string, string> = {
  brand: "bg-[#fff4ee] text-[#ff5c0e] ring-[#ffd7c2]",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  warning: "bg-amber-50 text-amber-800 ring-amber-100",
  danger: "bg-rose-50 text-rose-700 ring-rose-100",
  neutral: "bg-[#f4f5f7] text-[#3b414c] ring-[#e7e9ee]",
}

type OrderStatusBadgeProps = {
  label?: string | null
  statusKey?: string | null
  kind?: "payment" | "fulfillment" | "order" | "shipment"
}

export default function OrderStatusBadge({
  label,
  statusKey,
  kind = "order",
}: OrderStatusBadgeProps) {
  const tone = statusBadgeTone(kind, statusKey)
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-[12px] font-semibold ring-1 ring-inset ${TONE_CLASS[tone]}`}
    >
      {label || formatStatusLabel(statusKey)}
    </span>
  )
}
