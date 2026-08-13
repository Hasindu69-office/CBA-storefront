import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { CbaOrderDocument } from "types/order-documents"
import type { CbaCustomerOrderTracking } from "types/order-tracking"
import type { CbaReturnEligibility } from "types/return-intake"
import {
  currentTimelineHighlight,
  formatOrderNumber,
  formatStatusLabel,
  formatTrackingDate,
  isSafeExternalUrl,
  primaryTrackingLabel,
} from "../utils/format-tracking"
import OrderDetailsSidebar from "../components/order-details-sidebar"
import OrderStatusBadge from "../components/order-status-badge"
import OrderTimelineHorizontal from "../components/order-timeline-horizontal"
import OrderTrackingSupportBar from "../components/order-tracking-support-bar"
import ShipmentCard from "../components/shipment-card"
import { OrderTrackingEmptyState } from "../components/order-tracking-states"

type AccountOrderTrackingTemplateProps = {
  tracking: CbaCustomerOrderTracking
  backHref?: string
  showBackLink?: boolean
  returnEligibility?: CbaReturnEligibility
  documents?: CbaOrderDocument[]
  orderId?: string
}

export default function AccountOrderTrackingTemplate({
  tracking,
  backHref = "/account/orders",
  showBackLink = true,
  returnEligibility,
  documents,
  orderId,
}: AccountOrderTrackingTemplateProps) {
  const { order, fulfillments, timeline, next_expected_step } = tracking
  const isCancelled = order.status === "canceled"
  const primaryTracking = primaryTrackingLabel(fulfillments)
  const statusHighlight = currentTimelineHighlight(timeline, next_expected_step?.title)

  return (
    <div className="flex flex-col gap-6" data-testid="order-tracking-container">
      <header className="flex flex-col gap-4 border-b border-[#eeeeee] pb-6 small:flex-row small:items-start small:justify-between">
        <div>
          {showBackLink && (
            <LocalizedClientLink
              href={backHref}
              className="mb-3 inline-flex text-[13px] font-semibold text-[#5d6470] hover:text-[#ff5c0e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5c0e]"
            >
              Back to orders
            </LocalizedClientLink>
          )}
          <h1 className="text-[28px] font-bold leading-tight text-[#151922]">
            {formatOrderNumber(order.display_id)}
          </h1>
          {primaryTracking?.tracking_number && (
            <p className="mt-2 text-[14px] text-[#5d6470]">
              Tracking:{" "}
              {isSafeExternalUrl(primaryTracking.tracking_url) ? (
                <a
                  href={primaryTracking.tracking_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#ff5c0e] underline-offset-2 hover:underline"
                >
                  {primaryTracking.tracking_number}
                </a>
              ) : (
                <span className="font-semibold text-[#151922]">
                  {primaryTracking.tracking_number}
                </span>
              )}
            </p>
          )}
          <p className="mt-2 text-[14px] text-[#5d6470]">
            Placed {formatTrackingDate(order.created_at) ?? "Recently"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <OrderStatusBadge
              kind="order"
              statusKey={order.status}
              label={formatStatusLabel(order.status)}
            />
            <OrderStatusBadge
              kind="payment"
              statusKey={order.payment_status}
              label={formatStatusLabel(order.payment_status)}
            />
            <OrderStatusBadge
              kind="fulfillment"
              statusKey={order.fulfillment_status}
              label={formatStatusLabel(order.fulfillment_status)}
            />
          </div>
        </div>
        <div className="text-left small:text-right">
          <p className="text-[13px] font-medium text-[#5d6470]">Order total</p>
          <p className="mt-1 text-[22px] font-bold text-[#151922]">
            {convertToLocale({
              amount: tracking.totals.total,
              currency_code: order.currency_code,
            })}
          </p>
        </div>
      </header>

      {isCancelled && (
        <OrderTrackingEmptyState
          title="This order was cancelled"
          message="Upcoming delivery steps are not shown for cancelled orders. Contact support if you need help."
        />
      )}

      <section className="overflow-hidden rounded-[8px] border border-[#eeeeee] bg-white shadow-[0_2px_12px_rgba(20,26,34,0.04)]">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="border-b border-[#eeeeee] p-5 small:p-6 lg:border-b-0 lg:border-r">
            <h2 className="text-[18px] font-semibold text-[#151922]">
              Delivery status
            </h2>

            <div className="mt-5 rounded-[8px] bg-[#fafbfc] px-4 py-4 small:px-5">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8a919c]">
                Current status
              </p>
              <p className="mt-1 text-[16px] font-semibold text-[#151922]">
                {statusHighlight.title}
              </p>
              {statusHighlight.description && (
                <p className="mt-1 text-[14px] leading-6 text-[#5d6470]">
                  {statusHighlight.description}
                </p>
              )}
            </div>

            <div className="mt-6">
              <OrderTimelineHorizontal
                items={timeline}
                nextStepTitle={next_expected_step?.title}
              />
            </div>

            <div className="mt-8 border-t border-[#eeeeee] pt-6">
              <h3 className="text-[16px] font-semibold text-[#151922]">Shipments</h3>
              <div className="mt-4 flex flex-col gap-4">
                {fulfillments.length === 0 ? (
                  <OrderTrackingEmptyState
                    title="No shipment yet"
                    message="Tracking information will appear here once your order is packed and shipped."
                  />
                ) : (
                  fulfillments.map((fulfillment, index) => (
                    <ShipmentCard
                      key={fulfillment.id}
                      fulfillment={fulfillment}
                      index={index}
                      embedded
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <aside className="bg-[#fcfcfd] p-5 small:p-6">
            <OrderDetailsSidebar
              tracking={tracking}
              documents={documents}
              orderId={orderId ?? order.id}
            />
          </aside>
        </div>
      </section>

      <OrderTrackingSupportBar
        orderId={order.id}
        returnEligibility={returnEligibility}
      />
    </div>
  )
}
