import { convertToLocale } from "@lib/util/money"
import type { CbaCustomerOrderTracking } from "types/order-tracking"
import OrderStatusBadge from "../order-status-badge"

type OrderPaymentSummaryProps = {
  tracking: CbaCustomerOrderTracking
}

export default function OrderPaymentSummary({
  tracking,
}: OrderPaymentSummaryProps) {
  const { totals, payment, order } = tracking
  const currency = order.currency_code

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-[#151922]">Payment</h3>
        <OrderStatusBadge
          kind="payment"
          statusKey={payment.status.key}
          label={payment.status.label}
        />
      </div>
      {payment.provider && (
        <p className="text-[13px] text-[#5d6470]">
          Method:{" "}
          <span className="font-semibold capitalize text-[#151922]">
            {payment.provider}
          </span>
        </p>
      )}
      <div className="flex flex-col gap-2 border-t border-[#eeeeee] pt-3 text-[14px]">
        <Row
          label="Subtotal"
          value={convertToLocale({ amount: totals.subtotal, currency_code: currency })}
        />
        {totals.discount_total > 0 && (
          <Row
            label="Discount"
            value={`- ${convertToLocale({
              amount: totals.discount_total,
              currency_code: currency,
            })}`}
            tone="discount"
          />
        )}
        <Row
          label="Shipping"
          value={convertToLocale({
            amount: totals.shipping_total,
            currency_code: currency,
          })}
        />
        {totals.tax_total > 0 && (
          <Row
            label="Tax"
            value={convertToLocale({
              amount: totals.tax_total,
              currency_code: currency,
            })}
          />
        )}
        <div className="flex items-center justify-between border-t border-[#eeeeee] pt-3 text-[16px] font-bold text-[#151922]">
          <span>Total</span>
          <span>
            {convertToLocale({ amount: totals.total, currency_code: currency })}
          </span>
        </div>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: string
  tone?: "default" | "discount"
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[#3b414c]">{label}</span>
      <span
        className={
          tone === "discount"
            ? "font-semibold text-[#24a148]"
            : "font-medium text-[#1c222c]"
        }
      >
        {value}
      </span>
    </div>
  )
}
