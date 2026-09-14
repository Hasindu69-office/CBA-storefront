"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"
import type {
  SupportTicketCategory,
  SupportTicketDetail,
  SupportTicketListItem,
} from "@modules/support/lib/types"
import { SUPPORT_TICKET_CATEGORIES } from "@modules/support/lib/types"
import { validateSafeMessageText } from "@lib/util/storefront-form-validation"

type ListResponse = {
  success: boolean
  tickets: SupportTicketListItem[]
  count: number
}

type DetailResponse = {
  success: boolean
  ticket: SupportTicketDetail
}

type ActionResponse = {
  success: boolean
  ticket?: SupportTicketDetail
  message?: string
  error?: { message?: string; fields?: Record<string, string> }
}

async function authHeaders() {
  return {
    ...(await getAuthHeaders()),
  }
}

export async function listSupportTickets(params?: {
  limit?: number
  offset?: number
  status?: string
  open_only?: boolean
}) {
  const headers = await authHeaders()
  const search = new URLSearchParams()
  if (params?.limit != null) search.set("limit", String(params.limit))
  if (params?.offset != null) search.set("offset", String(params.offset))
  if (params?.status) search.set("status", params.status)
  if (params?.open_only) search.set("open_only", "true")
  const query = search.toString()

  return sdk.client.fetch<ListResponse>(
    `/store/cba/v1/support/tickets${query ? `?${query}` : ""}`,
    {
      method: "GET",
      headers,
      cache: "no-store",
    }
  )
}

export async function getSupportTicket(ticketNo: string) {
  const headers = await authHeaders()
  return sdk.client.fetch<DetailResponse>(
    `/store/cba/v1/support/tickets/${encodeURIComponent(ticketNo)}`,
    {
      method: "GET",
      headers,
      cache: "no-store",
    }
  )
}

export async function createSupportTicket(input: {
  category: SupportTicketCategory
  subject: string
  message: string
  related_order_id?: string | null
  source?: string
  client_message_id?: string
}) {
  const fieldErrors: Record<string, string> = {}
  if (!SUPPORT_TICKET_CATEGORIES.includes(input.category)) {
    fieldErrors.category = "Please select a category."
  }
  const subjectError = validateSafeMessageText(input.subject, "Subject", {
    min: 5,
    max: 120,
  })
  const messageError = validateSafeMessageText(input.message, "Message", {
    min: 10,
    max: 5000,
  })
  if (subjectError) fieldErrors.subject = subjectError
  if (messageError) fieldErrors.message = messageError
  if (Object.keys(fieldErrors).length) {
    return {
      success: false,
      error: {
        message: "Please check the highlighted fields and try again.",
        fields: fieldErrors,
      },
    }
  }

  const headers = await authHeaders()
  return sdk.client.fetch<ActionResponse>("/store/cba/v1/support/tickets", {
    method: "POST",
    headers,
    body: {
      category: input.category,
      subject: input.subject,
      message: input.message,
      related_order_id: input.related_order_id || null,
      source: input.source ?? "account",
      client_message_id: input.client_message_id,
    },
    cache: "no-store",
  })
}

export async function replyToSupportTicket(
  ticketNo: string,
  input: { body: string; client_message_id?: string }
) {
  const headers = await authHeaders()
  return sdk.client.fetch<ActionResponse>(
    `/store/cba/v1/support/tickets/${encodeURIComponent(ticketNo)}/messages`,
    {
      method: "POST",
      headers,
      body: {
        body: input.body,
        client_message_id: input.client_message_id,
      },
      cache: "no-store",
    }
  )
}

export async function closeSupportTicket(ticketNo: string) {
  const headers = await authHeaders()
  return sdk.client.fetch<ActionResponse>(
    `/store/cba/v1/support/tickets/${encodeURIComponent(ticketNo)}/close`,
    {
      method: "POST",
      headers,
      body: {},
      cache: "no-store",
    }
  )
}

export async function reopenSupportTicket(ticketNo: string) {
  const headers = await authHeaders()
  return sdk.client.fetch<ActionResponse>(
    `/store/cba/v1/support/tickets/${encodeURIComponent(ticketNo)}/reopen`,
    {
      method: "POST",
      headers,
      body: {},
      cache: "no-store",
    }
  )
}
