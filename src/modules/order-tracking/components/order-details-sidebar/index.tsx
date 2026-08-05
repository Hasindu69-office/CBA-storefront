import type { CbaCustomerOrderTracking } from "types/order-tracking"
import OrderAddressCard from "../order-address-card"
import OrderItemsSummary from "../order-items-summary"
import OrderPaymentSummary from "../order-payment-summary"

type OrderDetailsSidebarProps = {
  tracking: CbaCustomerOrderTracking
}

export default function OrderDetailsSidebar({ tracking }: OrderDetailsSidebarProps) {
  const shippingMethod = tracking.shipping_methods[0]?.name

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[16px] font-semibold text-[#151922]">Order details</h2>
        <p className="mt-1 text-[13px] text-[#5d6470]">
          {tracking.items.length}{" "}
          {tracking.items.length === 1 ? "item" : "items"} in this order
        </p>
      </div>

      <div className="border-t border-[#eeeeee] pt-5">
        <h3 className="mb-3 text-[14px] font-semibold text-[#151922]">Items</h3>
        <OrderItemsSummary
          items={tracking.items}
          currencyCode={tracking.order.currency_code}
          compact
        />
      </div>

      <div className="border-t border-[#eeeeee] pt-5">
        <OrderAddressCard
          title="Delivery address"
          address={tracking.addresses.shipping}
          shippingMethodName={shippingMethod}
        />
      </div>

      <div className="border-t border-[#eeeeee] pt-5">
        <OrderPaymentSummary tracking={tracking} />
      </div>
    </div>
  )
}
