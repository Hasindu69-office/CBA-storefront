import { Metadata } from "next"
import { notFound } from "next/navigation"

import { listAccountOrders } from "@lib/data/order-tracking"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import OrderStatusBadge from "@modules/order-tracking/components/order-status-badge"
import { formatOrderNumber, formatTrackingDate } from "@modules/order-tracking/utils/format-tracking"
import { convertToLocale } from "@lib/util/money"
import Thumbnail from "@modules/products/components/thumbnail"
import TransferRequestForm from "@modules/account/components/transfer-request-form"
import Divider from "@modules/common/components/divider"

export const metadata: Metadata = {
  title: "Orders",
  description: "View and track your CBA orders.",
}

export default async function Orders() {
  const result = await listAccountOrders(20, 0)

  if (!result) {
    notFound()
  }

  const orders = result.orders

  return (
    <div className="w-full" data-testid="orders-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-3">
        <h1 className="text-[28px] font-bold text-[#151922]">Orders</h1>
        <p className="text-[14px] text-[#5d6470]">
          View previous orders, payment status, and shipment tracking.
        </p>
      </div>

      {orders.length ? (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const hasTracking =
              order.fulfillment?.has_tracking ||
              ["shipped", "partially_shipped", "delivered", "partially_delivered"].includes(
                order.fulfillment_status?.key ?? ""
              )
            return (
              <article
                key={order.id}
                className="rounded-[8px] border border-[#eeeeee] bg-white p-5 shadow-[0_2px_12px_rgba(20,26,34,0.04)]"
                data-testid="order-card"
              >
                <div className="flex flex-col gap-4 small:flex-row small:items-start small:justify-between">
                  <div className="flex gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-[#f6f7f9]">
                      <Thumbnail
                        thumbnail={order.thumbnail}
                        images={[]}
                        size="square"
                      />
                    </div>
                    <div>
                      <h2 className="text-[16px] font-semibold text-[#151922]">
                        {formatOrderNumber(order.display_id)}
                      </h2>
                      <p className="mt-1 text-[13px] text-[#5d6470]">
                        {formatTrackingDate(order.created_at)} · {order.item_count}{" "}
                        {order.item_count === 1 ? "item" : "items"}
                      </p>
                      <p className="mt-1 text-[14px] font-semibold text-[#151922]">
                        {convertToLocale({
                          amount: order.total,
                          currency_code: order.currency_code,
                        })}
                      </p>
                      {order.primary_item_title && (
                        <p className="mt-1 text-[13px] text-[#5d6470]">
                          {order.primary_item_title}
                          {order.additional_item_count > 0
                            ? ` +${order.additional_item_count} more`
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 small:items-end">
                    <OrderStatusBadge
                      kind="payment"
                      statusKey={order.payment_status.key}
                      label={order.payment_status.label}
                    />
                    <OrderStatusBadge
                      kind="fulfillment"
                      statusKey={order.fulfillment_status.key}
                      label={order.fulfillment_status.label}
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <LocalizedClientLink
                    href={`/account/orders/details/${order.id}`}
                    className="inline-flex rounded-md border border-[#e5e7eb] px-3.5 py-2 text-[13px] font-semibold text-[#151922] transition hover:border-[#ff5c0e] hover:text-[#ff5c0e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5c0e]"
                  >
                    View order
                  </LocalizedClientLink>
                  {hasTracking && (
                    <LocalizedClientLink
                      href={`/account/orders/details/${order.id}`}
                      className="inline-flex rounded-md bg-[#ff5c0e] px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#e6520c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5c0e]"
                    >
                      Track order
                    </LocalizedClientLink>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="rounded-[8px] border border-dashed border-[#d7dbe3] px-5 py-10 text-center">
          <h2 className="text-[18px] font-semibold text-[#151922]">No orders yet</h2>
          <p className="mt-2 text-[14px] text-[#5d6470]">
            When you place an order, it will appear here with tracking updates.
          </p>
          <LocalizedClientLink
            href="/store"
            className="mt-5 inline-flex rounded-md bg-[#ff5c0e] px-4 py-2.5 text-[14px] font-semibold text-white"
          >
            Continue shopping
          </LocalizedClientLink>
        </div>
      )}

      <Divider className="my-16" />
      <TransferRequestForm />
    </div>
  )
}
