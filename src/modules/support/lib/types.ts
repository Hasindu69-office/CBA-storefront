export const SUPPORT_TICKET_CATEGORIES = [
  "order",
  "delivery",
  "payment",
  "invoice",
  "return",
  "refund",
  "exchange",
  "warranty",
  "product",
  "technical",
  "account",
  "general",
  "other",
] as const

export type SupportTicketCategory = (typeof SUPPORT_TICKET_CATEGORIES)[number]

export type SupportTicketListItem = {
  ticket_no: string
  category: string
  subject: string
  status: string
  status_label: string
  priority: string
  related_order_id: string | null
  related_order_display_id: string | null
  created_at: string | null
  updated_at: string | null
  last_customer_message_at: string | null
  last_staff_message_at: string | null
}

export type SupportTicketMessage = {
  id: string
  author_type: string
  body: string
  created_at: string | null
}

export type SupportTicketDetail = SupportTicketListItem & {
  related_return_intake_id: string | null
  closed_at: string | null
  messages: SupportTicketMessage[]
  timeline: Array<{
    event_type: string
    customer_visible: boolean
    created_at: string | null
    to_value: unknown
  }>
  attachments: Array<{
    id: string
    original_name: string
    content_type: string
    size_bytes: number
    created_at: string | null
  }>
}
