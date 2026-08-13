import { getPercentageDiff } from "@lib/util/get-percentage-diff"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type LineItemPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  currencyCode: string
}

const LineItemPrice = ({
  item,
  style = "default",
  currencyCode,
}: LineItemPriceProps) => {
  const { total, original_total } = item
  const currentPrice = total ?? 0
  const originalPrice = original_total ?? currentPrice
  const hasReducedPrice = currentPrice < originalPrice

  return (
    <div className="flex flex-col items-end gap-1 text-right">
      <div className="text-right">
        {hasReducedPrice && (
          <div className="mb-0.5 flex flex-col items-end gap-1">
            <p className="text-[12px] leading-4 text-[#8b90a0]">
              {style === "default" && (
                <span className="mr-1">Original:</span>
              )}
              <span
                className="line-through decoration-[#aeb4c0]"
                data-testid="product-original-price"
              >
                {convertToLocale({
                  amount: originalPrice,
                  currency_code: currencyCode,
                })}
              </span>
            </p>
            {style === "default" && (
              <span className="inline-flex rounded bg-[#fff2e6] px-2 py-0.5 text-[11px] font-semibold text-brand">
                -{getPercentageDiff(originalPrice, currentPrice || 0)}%
              </span>
            )}
          </div>
        )}
        <span
          className={[
            "block text-[15px] font-bold leading-5",
            hasReducedPrice ? "text-brand" : "text-[#111827]",
          ].join(" ")}
          data-testid="product-price"
        >
          {convertToLocale({
            amount: currentPrice,
            currency_code: currencyCode,
          })}
        </span>
      </div>
    </div>
  )
}

export default LineItemPrice
