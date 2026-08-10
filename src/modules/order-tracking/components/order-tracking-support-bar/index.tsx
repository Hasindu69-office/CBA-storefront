import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { CbaReturnEligibility } from "types/return-intake"

type Props = {
  orderId: string
  returnEligibility?: CbaReturnEligibility
}

export default function OrderTrackingSupportBar({ orderId, returnEligibility }: Props) {
  const activeRequest = returnEligibility?.active_requests?.[0]
  const canRequest = returnEligibility?.available === true
  const requestHref = `/account/orders/details/${orderId}/request`
  const activeHref = activeRequest
    ? `/account/returns/${encodeURIComponent(activeRequest.request_no)}`
    : null

  return (
    <section className="rounded-[8px] border border-[#eeeeee] bg-[#fafbfc] px-5 py-6 small:px-6">
      <div className="flex flex-col gap-4 small:flex-row small:items-center small:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-[16px] font-semibold text-[#151922]">Need help?</h2>
          <p className="mt-1 text-[14px] leading-6 text-[#5d6470]">
            {returnEligibility?.disclaimer ??
              "Questions about delivery or your order? Our support team can help."}
          </p>
          {!canRequest && returnEligibility?.reason === "active_request_exists" && activeRequest && (
            <p className="mt-2 text-[13px] text-[#9a3d0a]">
              You already have request {activeRequest.request_no} ({activeRequest.status}).
            </p>
          )}
          {!canRequest && returnEligibility?.reason === "order_already_refunded" && (
            <p className="mt-2 text-[13px] text-[#5d6470]">
              This order has already been refunded.
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <LocalizedClientLink
            href="/contact"
            className="inline-flex items-center justify-center rounded-md bg-[#ff5c0e] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#e6520c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5c0e]"
          >
            Contact support
          </LocalizedClientLink>
          {activeHref ? (
            <LocalizedClientLink
              href={activeHref}
              className="inline-flex items-center justify-center rounded-md border border-[#e5e7eb] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#151922] transition hover:border-[#ff5c0e] hover:text-[#ff5c0e]"
            >
              View return request
            </LocalizedClientLink>
          ) : canRequest ? (
            <LocalizedClientLink
              href={requestHref}
              className="inline-flex items-center justify-center rounded-md border border-[#ff5c0e] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#ff5c0e] transition hover:bg-[#fff4ee]"
            >
              Request return or support
            </LocalizedClientLink>
          ) : (
            <span
              className="inline-flex items-center rounded-md border border-[#e5e7eb] bg-white px-4 py-2.5 text-[13px] font-medium text-[#8a919c]"
              title={returnEligibility?.reason ?? "Not available"}
            >
              Returns unavailable
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
