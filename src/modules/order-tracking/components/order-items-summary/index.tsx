import { convertToLocale } from "@lib/util/money"
import Thumbnail from "@modules/products/components/thumbnail"
import type { CbaCustomerOrderTracking } from "types/order-tracking"

type OrderItemsSummaryProps = {
  items: CbaCustomerOrderTracking["items"]
  currencyCode: string
  compact?: boolean
}

export default function OrderItemsSummary({
  items,
  currencyCode,
  compact = false,
}: OrderItemsSummaryProps) {
  if (!items.length) {
    return <p className="text-[14px] text-[#5d6470]">No items on this order.</p>
  }

  return (
    <ul className={compact ? "flex flex-col gap-3" : "flex flex-col gap-4"}>
      {items.map((item) => (
        <li
          key={item.id}
          className={`flex gap-3 ${
            compact
              ? "border-b border-[#eeeeee] pb-3 last:border-b-0 last:pb-0"
              : "gap-4 border-b border-[#eeeeee] pb-4 last:border-b-0 last:pb-0"
          }`}
        >
          <div
            className={`shrink-0 overflow-hidden rounded bg-[#f6f7f9] ${
              compact ? "h-12 w-12" : "h-16 w-16"
            }`}
          >
            <Thumbnail thumbnail={item.thumbnail} images={[]} size="square" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`font-semibold text-[#151922] ${
                compact ? "text-[13px] leading-5" : "text-[15px]"
              }`}
            >
              {item.title}
            </p>
            {item.variant_title && (
              <p className="text-[12px] text-[#5d6470]">{item.variant_title}</p>
            )}
            <p className="mt-0.5 text-[12px] text-[#5d6470]">Qty {item.quantity}</p>
          </div>
          <div
            className={`text-right font-semibold text-[#151922] ${
              compact ? "text-[13px]" : "text-[14px]"
            }`}
          >
            {convertToLocale({ amount: item.total, currency_code: currencyCode })}
          </div>
        </li>
      ))}
    </ul>
  )
}
