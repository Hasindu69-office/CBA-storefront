import { mapAuthoritativeTotals } from "@lib/util/cart-totals"
import { HttpTypes } from "@medusajs/types"

type OrderSummaryProps = {
  order: HttpTypes.StoreOrder
}

const OrderSummary = ({ order }: OrderSummaryProps) => {
  const mapped = mapAuthoritativeTotals(order as never)

  return (
    <div>
      <h2 className="text-base-semi">Order Summary</h2>
      <div className="text-small-regular text-ui-fg-base my-2">
        <div className="flex items-center justify-between text-base-regular text-ui-fg-base mb-2">
          <span>Subtotal</span>
          <span>{mapped.rows.find((row) => row.key === "subtotal")?.display}</span>
        </div>
        <div className="flex flex-col gap-y-1">
          {mapped.rows
            .filter((row) => row.key !== "subtotal")
            .map((row) => (
              <div className="flex items-center justify-between" key={row.key}>
                <span>{row.label}</span>
                <span>{row.key === "discount" ? `- ${row.display}` : row.display}</span>
              </div>
            ))}
        </div>
        <div className="h-px w-full border-b border-gray-200 border-dashed my-4" />
        <div className="flex items-center justify-between text-base-regular text-ui-fg-base mb-2">
          <span>Total</span>
          <span>{mapped.total.display}</span>
        </div>
        {mapped.taxNote && (
          <p className="text-small-regular text-ui-fg-subtle">{mapped.taxNote}</p>
        )}
      </div>
    </div>
  )
}

export default OrderSummary
