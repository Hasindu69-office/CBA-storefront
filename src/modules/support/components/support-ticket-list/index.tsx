import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { SupportTicketListItem } from "@modules/support/lib/types"

type Props = {
  tickets: SupportTicketListItem[]
}

export default function SupportTicketList({ tickets }: Props) {
  return (
    <div className="flex flex-col gap-6" data-testid="account-support-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#151922]">Support</h1>
          <p className="mt-2 text-[14px] text-[#5d6470]">
            View and manage your support conversations with CBA.
          </p>
        </div>
        <LocalizedClientLink
          href="/account/support/new"
          className="inline-flex h-11 items-center justify-center rounded-md bg-[#ff5c0e] px-5 text-[14px] font-semibold text-white transition hover:bg-[#e6520c]"
        >
          New ticket
        </LocalizedClientLink>
      </div>

      <div className="flex flex-col gap-4">
        {tickets.map((ticket) => (
          <LocalizedClientLink
            key={ticket.ticket_no}
            href={`/account/support/${encodeURIComponent(ticket.ticket_no)}`}
            className="rounded-[8px] border border-[#eeeeee] bg-white p-5 shadow-[0_2px_12px_rgba(20,26,34,0.04)] transition hover:border-[#ff5c0e]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[16px] font-semibold text-[#151922]">
                  {ticket.ticket_no}
                </p>
                <p className="mt-1 text-[14px] text-[#151922]">{ticket.subject}</p>
                <p className="mt-1 text-[13px] text-[#5d6470]">
                  {ticket.category}
                  {ticket.related_order_display_id
                    ? ` · Order CBA-${ticket.related_order_display_id}`
                    : ""}
                </p>
              </div>
              <span className="rounded-md bg-[#fff4ee] px-2.5 py-1 text-[12px] font-semibold text-[#ff5c0e]">
                {ticket.status_label}
              </span>
            </div>
          </LocalizedClientLink>
        ))}

        {!tickets.length && (
          <div className="rounded-[8px] border border-dashed border-[#d7dbe3] bg-[#fafbfc] p-8 text-center">
            <p className="text-[16px] font-semibold text-[#151922]">
              No support tickets yet
            </p>
            <p className="mt-2 text-[14px] text-[#5d6470]">
              Open a ticket if you need help with an order, delivery, payment, or
              product.
            </p>
            <LocalizedClientLink
              href="/account/support/new"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-[#ff5c0e] px-5 text-[14px] font-semibold text-white transition hover:bg-[#e6520c]"
            >
              Create a ticket
            </LocalizedClientLink>
          </div>
        )}
      </div>
    </div>
  )
}
