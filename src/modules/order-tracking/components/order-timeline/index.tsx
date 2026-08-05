import type { CbaOrderTimelineItem } from "types/order-tracking"
import OrderTimelineItemView from "../order-timeline-item"

type OrderTimelineProps = {
  items: CbaOrderTimelineItem[]
  nextStepTitle?: string | null
}

export default function OrderTimeline({
  items,
  nextStepTitle,
}: OrderTimelineProps) {
  if (!items.length) {
    return (
      <p className="text-[14px] text-[#5d6470]">
        Order progress will appear here as your order moves forward.
      </p>
    )
  }

  return (
    <div>
      <ol className="m-0 list-none p-0">
        {items.map((item, index) => (
          <OrderTimelineItemView
            key={item.id}
            item={item}
            isLast={index === items.length - 1}
          />
        ))}
      </ol>
      {nextStepTitle && (
        <p className="mt-2 text-[13px] font-medium text-[#5d6470]">
          Next: {nextStepTitle}
        </p>
      )}
    </div>
  )
}
