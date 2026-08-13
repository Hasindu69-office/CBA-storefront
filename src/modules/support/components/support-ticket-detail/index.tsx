"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  closeSupportTicket,
  reopenSupportTicket,
  replyToSupportTicket,
} from "@lib/data/support"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { SupportTicketDetail } from "@modules/support/lib/types"

type Props = {
  initialTicket: SupportTicketDetail
}

const REOPEN_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

export default function SupportTicketDetail({ initialTicket }: Props) {
  const router = useRouter()
  const [ticket, setTicket] = useState(initialTicket)
  const [pending, startTransition] = useTransition()
  const [reply, setReply] = useState("")
  const [error, setError] = useState<string | null>(null)

  const canReply =
    ticket.status !== "closed" && ticket.status !== "resolved"
  const canClose = ticket.status !== "closed"
  const canReopen = useMemo(() => {
    if (ticket.status !== "closed" && ticket.status !== "resolved") return false
    if (!ticket.closed_at && ticket.status === "resolved") return true
    if (!ticket.closed_at) return false
    const closed = new Date(ticket.closed_at).getTime()
    if (Number.isNaN(closed)) return false
    return Date.now() - closed <= REOPEN_WINDOW_MS
  }, [ticket.closed_at, ticket.status])

  function refreshTicket(next: SupportTicketDetail) {
    setTicket(next)
    router.refresh()
  }

  function onReply(event: React.FormEvent) {
    event.preventDefault()
    const body = reply.trim()
    if (body.length < 1) {
      setError("Please enter a reply.")
      return
    }

    startTransition(async () => {
      setError(null)
      try {
        const result = await replyToSupportTicket(ticket.ticket_no, {
          body,
          client_message_id: crypto.randomUUID(),
        })
        if (!result.success || !result.ticket) {
          setError(result.error?.message ?? "Could not send your reply.")
          return
        }
        setReply("")
        refreshTicket(result.ticket)
      } catch (err: any) {
        setError(err?.message ?? "Could not send your reply.")
      }
    })
  }

  function onClose() {
    startTransition(async () => {
      setError(null)
      try {
        const result = await closeSupportTicket(ticket.ticket_no)
        if (!result.success || !result.ticket) {
          setError(result.error?.message ?? "Could not close this ticket.")
          return
        }
        refreshTicket(result.ticket)
      } catch (err: any) {
        setError(err?.message ?? "Could not close this ticket.")
      }
    })
  }

  function onReopen() {
    startTransition(async () => {
      setError(null)
      try {
        const result = await reopenSupportTicket(ticket.ticket_no)
        if (!result.success || !result.ticket) {
          setError(result.error?.message ?? "Could not reopen this ticket.")
          return
        }
        refreshTicket(result.ticket)
      } catch (err: any) {
        setError(err?.message ?? "Could not reopen this ticket.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6" data-testid="account-support-detail-page">
      <div>
        <LocalizedClientLink
          href="/account/support"
          className="text-[13px] font-semibold text-[#ff5c0e] hover:underline"
        >
          ← Back to support
        </LocalizedClientLink>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-[#151922]">
              {ticket.ticket_no}
            </h1>
            <p className="mt-2 text-[16px] font-semibold text-[#151922]">
              {ticket.subject}
            </p>
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
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-[#ffcdd2] bg-[#fff5f5] px-4 py-3 text-[14px] text-[#b71c1c]"
        >
          {error}
        </div>
      )}

      <section className="rounded-[8px] border border-[#eeeeee] bg-white p-5">
        <h2 className="text-[16px] font-bold text-[#151922]">Conversation</h2>
        <ul className="mt-4 space-y-4">
          {ticket.messages.map((message) => (
            <li
              key={message.id}
              className={[
                "rounded-md border px-4 py-3",
                message.author_type === "customer"
                  ? "border-[#ffe0cc] bg-[#fff8f4]"
                  : "border-[#eeeeee] bg-[#fafbfc]",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8a919c]">
                  {message.author_type === "customer"
                    ? "You"
                    : message.author_type === "admin"
                      ? "CBA Support"
                      : "System"}
                </p>
                {message.created_at && (
                  <time className="text-[12px] text-[#8a919c]">
                    {new Date(message.created_at).toLocaleString()}
                  </time>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-[14px] leading-6 text-[#151922]">
                {message.body}
              </p>
            </li>
          ))}
          {!ticket.messages.length && (
            <li className="text-[14px] text-[#5d6470]">No messages yet.</li>
          )}
        </ul>
      </section>

      {canReply && (
        <form
          onSubmit={onReply}
          className="rounded-[8px] border border-[#eeeeee] bg-white p-5"
        >
          <label
            htmlFor="support-reply"
            className="mb-1.5 block text-[13px] font-semibold text-[#151922]"
          >
            Reply
          </label>
          <textarea
            id="support-reply"
            rows={4}
            value={reply}
            disabled={pending}
            onChange={(event) => setReply(event.target.value)}
            className="w-full rounded-md border border-[#eeeeee] bg-white px-3.5 py-2.5 text-[14px] text-[#151922] outline-none focus:ring-2 focus:ring-[#ff5c0e]/40 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={pending}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#ff5c0e] px-5 text-[14px] font-semibold text-white transition hover:bg-[#e6520c] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Sending..." : "Send reply"}
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-3">
        {canClose && (
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-md border border-[#eeeeee] bg-white px-5 text-[14px] font-semibold text-[#151922] transition hover:border-[#ff5c0e] hover:text-[#ff5c0e] disabled:opacity-70"
          >
            Close ticket
          </button>
        )}
        {canReopen && (
          <button
            type="button"
            disabled={pending}
            onClick={onReopen}
            className="inline-flex h-11 items-center justify-center rounded-md border border-[#ff5c0e] bg-white px-5 text-[14px] font-semibold text-[#ff5c0e] transition hover:bg-[#fff4ee] disabled:opacity-70"
          >
            Reopen ticket
          </button>
        )}
      </div>
    </div>
  )
}
