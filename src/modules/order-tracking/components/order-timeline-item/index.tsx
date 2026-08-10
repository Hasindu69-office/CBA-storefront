import type { CbaOrderTimelineItem } from "types/order-tracking"
import { formatTrackingDate } from "../../utils/format-tracking"

type OrderTimelineItemProps = {
  item: CbaOrderTimelineItem
  isLast: boolean
}

export default function OrderTimelineItemView({
  item,
  isLast,
}: OrderTimelineItemProps) {
  const isComplete = item.state === "complete" || item.state === "current"
  const isFailed = item.state === "failed" || item.state === "cancelled"
  const showTime =
    item.state === "complete" ||
    item.state === "current" ||
    item.state === "cancelled" ||
    item.state === "failed"

  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!isLast && (
        <span
          className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-px bg-[#e5e7eb]"
          aria-hidden
        />
      )}
      <span
        className={`relative z-[1] mt-1 h-6 w-6 shrink-0 rounded-full border-2 ${
          isFailed
            ? "border-rose-500 bg-rose-500"
            : isComplete
              ? "border-[#ff5c0e] bg-[#ff5c0e]"
              : "border-[#d1d5db] bg-white"
        }`}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p
            className={`text-[15px] font-semibold ${
              item.state === "upcoming" ? "text-[#8a919c]" : "text-[#151922]"
            }`}
          >
            {item.title}
          </p>
          {showTime && (
            <time
              dateTime={item.occurred_at}
              className="text-[12px] text-[#5d6470]"
            >
              {formatTrackingDate(item.occurred_at)}
            </time>
          )}
        </div>
        {item.description && (
          <p className="mt-1 text-[13px] leading-5 text-[#5d6470]">
            {item.description}
          </p>
        )}
        <span className="sr-only">Status: {item.state}</span>
      </div>
    </li>
  )
}
