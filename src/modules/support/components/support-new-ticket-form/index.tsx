"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { HttpTypes } from "@medusajs/types"

import {
  createSupportTicket,
} from "@lib/data/support"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  SUPPORT_TICKET_CATEGORIES,
  type SupportTicketCategory,
} from "@modules/support/lib/types"

type Props = {
  orders: HttpTypes.StoreOrder[]
}

const CATEGORY_LABELS: Record<SupportTicketCategory, string> = {
  order: "Order",
  delivery: "Delivery",
  payment: "Payment",
  invoice: "Invoice",
  return: "Return",
  refund: "Refund",
  exchange: "Exchange",
  warranty: "Warranty",
  product: "Product",
  technical: "Technical",
  account: "Account",
  general: "General",
  other: "Other",
}

export default function SupportNewTicketForm({ orders }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [category, setCategory] = useState<SupportTicketCategory>("general")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [relatedOrderId, setRelatedOrderId] = useState("")

  const orderOptions = useMemo(
    () =>
      orders.map((order) => ({
        id: order.id,
        label: `CBA-${order.display_id ?? order.id}`,
      })),
    [orders]
  )

  function validate() {
    const next: Record<string, string> = {}
    if (subject.trim().length < 5 || subject.trim().length > 120) {
      next.subject = "Subject must be between 5 and 120 characters."
    }
    if (message.trim().length < 10 || message.trim().length > 5000) {
      next.message = "Message must be between 10 and 5000 characters."
    }
    if (!SUPPORT_TICKET_CATEGORIES.includes(category)) {
      next.category = "Please select a category."
    }
    return next
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const nextErrors = validate()
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setError("Please check the highlighted fields and try again.")
      return
    }

    startTransition(async () => {
      setError(null)
      try {
        const result = await createSupportTicket({
          category,
          subject: subject.trim(),
          message: message.trim(),
          related_order_id: relatedOrderId || null,
          client_message_id: crypto.randomUUID(),
        })

        if (!result.success || !result.ticket?.ticket_no) {
          setError(
            result.error?.message ??
              "We could not create your ticket. Please try again."
          )
          if (result.error?.fields) setFieldErrors(result.error.fields)
          return
        }

        router.push(
          `/account/support/${encodeURIComponent(result.ticket.ticket_no)}`
        )
        router.refresh()
      } catch (err: any) {
        setError(err?.message ?? "We could not create your ticket. Please try again.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6" data-testid="account-support-new-page">
      <div>
        <LocalizedClientLink
          href="/account/support"
          className="text-[13px] font-semibold text-[#ff5c0e] hover:underline"
        >
          ← Back to support
        </LocalizedClientLink>
        <h1 className="mt-3 text-[28px] font-bold text-[#151922]">
          New support ticket
        </h1>
        <p className="mt-2 text-[14px] text-[#5d6470]">
          Tell us what you need help with. We will reply in this thread.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-[8px] border border-[#eeeeee] bg-white p-6 shadow-[0_2px_12px_rgba(20,26,34,0.04)]"
      >
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-md border border-[#ffcdd2] bg-[#fff5f5] px-4 py-3 text-[14px] text-[#b71c1c]"
          >
            {error}
          </div>
        )}

        <div className="grid gap-4">
          <div>
            <label
              htmlFor="support-category"
              className="mb-1.5 block text-[13px] font-semibold text-[#151922]"
            >
              Category
            </label>
            <select
              id="support-category"
              value={category}
              disabled={pending}
              onChange={(event) =>
                setCategory(event.target.value as SupportTicketCategory)
              }
              className={fieldClass(Boolean(fieldErrors.category))}
            >
              {SUPPORT_TICKET_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {CATEGORY_LABELS[item]}
                </option>
              ))}
            </select>
            {fieldErrors.category && (
              <p className="mt-1 text-[12px] text-[#b71c1c]">{fieldErrors.category}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="support-order"
              className="mb-1.5 block text-[13px] font-semibold text-[#151922]"
            >
              Related order (optional)
            </label>
            <select
              id="support-order"
              value={relatedOrderId}
              disabled={pending}
              onChange={(event) => setRelatedOrderId(event.target.value)}
              className={fieldClass(false)}
            >
              <option value="">No related order</option>
              {orderOptions.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="support-subject"
              className="mb-1.5 block text-[13px] font-semibold text-[#151922]"
            >
              Subject
            </label>
            <input
              id="support-subject"
              value={subject}
              disabled={pending}
              onChange={(event) => setSubject(event.target.value)}
              className={fieldClass(Boolean(fieldErrors.subject))}
            />
            {fieldErrors.subject && (
              <p className="mt-1 text-[12px] text-[#b71c1c]">{fieldErrors.subject}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="support-message"
              className="mb-1.5 block text-[13px] font-semibold text-[#151922]"
            >
              Message
            </label>
            <textarea
              id="support-message"
              rows={6}
              value={message}
              disabled={pending}
              onChange={(event) => setMessage(event.target.value)}
              className={`${fieldClass(Boolean(fieldErrors.message))} min-h-[150px] resize-y`}
            />
            {fieldErrors.message && (
              <p className="mt-1 text-[12px] text-[#b71c1c]">{fieldErrors.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#ff5c0e] px-6 text-[14px] font-semibold text-white transition hover:bg-[#e6520c] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Creating..." : "Create ticket"}
          </button>
        </div>
      </form>
    </div>
  )
}

function fieldClass(hasError: boolean) {
  return [
    "w-full rounded-md border bg-white px-3.5 py-2.5 text-[14px] text-[#151922] outline-none transition",
    "focus:ring-2 focus:ring-[#ff5c0e]/40 disabled:opacity-60",
    hasError ? "border-[#ef9a9a]" : "border-[#eeeeee]",
  ].join(" ")
}
