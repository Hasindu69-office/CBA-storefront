import { Metadata } from "next"

import { listReturnIntakeRequests } from "@lib/data/return-intake"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Return requests",
}

export default async function AccountReturnsPage() {
  const result = await listReturnIntakeRequests({ limit: 20, offset: 0 })

  if (!result) {
    redirect("/account")
  }

  return (
    <div className="flex flex-col gap-6" data-testid="account-returns-page">
      <div>
        <h1 className="text-[28px] font-bold text-[#151922]">Return requests</h1>
        <p className="mt-2 text-[14px] text-[#5d6470]">
          Track the status of your return, refund, exchange, and warranty requests.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {result.requests.map((request) => (
          <LocalizedClientLink
            key={request.request_no}
            href={`/account/returns/${encodeURIComponent(request.request_no)}`}
            className="rounded-[8px] border border-[#eeeeee] bg-white p-5 shadow-[0_2px_12px_rgba(20,26,34,0.04)] transition hover:border-[#ff5c0e]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[16px] font-semibold text-[#151922]">{request.request_no}</p>
                <p className="text-[13px] text-[#5d6470]">
                  {request.request_type} · Order{" "}
                  {request.order_display_id ? `CBA-${request.order_display_id}` : request.order_id}
                </p>
              </div>
              <span className="rounded-md bg-[#fff4ee] px-2.5 py-1 text-[12px] font-semibold text-[#ff5c0e]">
                {request.status_label}
              </span>
            </div>
          </LocalizedClientLink>
        ))}
        {!result.requests.length && (
          <div className="rounded-[8px] border border-dashed border-[#d7dbe3] bg-[#fafbfc] p-8 text-center">
            <p className="text-[16px] font-semibold text-[#151922]">No requests yet</p>
            <p className="mt-2 text-[14px] text-[#5d6470]">
              Open an order and use &quot;Request return or support&quot; to submit a request.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
