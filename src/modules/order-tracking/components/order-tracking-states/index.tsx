import type { ReactNode } from "react"

export default function OrderTrackingSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-10 w-1/3 rounded bg-[#eceff3]" />
      <div className="h-40 rounded bg-[#eceff3]" />
      <div className="h-56 rounded bg-[#eceff3]" />
    </div>
  )
}

export function OrderTrackingErrorState({
  title = "Unable to load order tracking",
  message = "Please try again in a moment.",
  action,
}: {
  title?: string
  message?: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-[8px] border border-[#eeeeee] bg-white px-5 py-10 text-center shadow-[0_2px_12px_rgba(20,26,34,0.04)]">
      <h2 className="text-[20px] font-semibold text-[#151922]">{title}</h2>
      <p className="mt-2 text-[14px] text-[#5d6470]">{message}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  )
}

export function OrderTrackingEmptyState({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <div className="min-w-0 rounded-[8px] border border-dashed border-[#d7dbe3] bg-[#fafbfc] px-5 py-8 text-center">
      <h3 className="break-words text-[16px] font-semibold text-[#151922]">
        {title}
      </h3>
      <p className="mt-2 break-words text-[14px] leading-6 text-[#5d6470]">
        {message}
      </p>
    </div>
  )
}
