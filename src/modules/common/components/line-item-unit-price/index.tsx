import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type LineItemUnitPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  currencyCode: string
}

const LineItemUnitPrice = ({
  item,
  style = "default",
  currencyCode,
}: LineItemUnitPriceProps) => {
  const { total, original_total } = item
  const currentTotal = total ?? 0
  const originalTotal = original_total ?? currentTotal
  const quantity = item.quantity || 1
  const hasReducedPrice = currentTotal < originalTotal

  const percentage_diff = Math.round(
    originalTotal ? ((originalTotal - currentTotal) / originalTotal) * 100 : 0
  )

  return (
    <div className="flex h-full flex-col justify-center text-right small:items-center small:text-center">
      {hasReducedPrice && (
        <div className="mb-0.5 flex flex-col items-end gap-1 small:items-center">
          <p className="text-[12px] leading-4 text-[#8b90a0]">
            {style === "default" && (
              <span className="mr-1">Original:</span>
            )}
            <span
              className="line-through decoration-[#aeb4c0]"
              data-testid="product-unit-original-price"
            >
              {convertToLocale({
                amount: originalTotal / quantity,
                currency_code: currencyCode,
              })}
            </span>
          </p>
          {style === "default" && (
            <span className="inline-flex rounded bg-[#fff2e6] px-2 py-0.5 text-[11px] font-semibold text-brand">
              -{percentage_diff}%
            </span>
          )}
        </div>
      )}
      <span
        className={[
          "block text-[15px] font-bold leading-5",
          hasReducedPrice ? "text-brand" : "text-[#111827]",
        ].join(" ")}
        data-testid="product-unit-price"
      >
        {convertToLocale({
          amount: currentTotal / quantity,
          currency_code: currencyCode,
        })}
      </span>
    </div>
  )
}

export default LineItemUnitPrice
