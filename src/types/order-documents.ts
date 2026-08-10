export type CbaOrderDocument = {
  id: string
  document_type: string
  status: string
  document_number: string | null
  order_id: string
  order_display_id: string | null
  currency_code: string
  amount_total: number | null
  issue_date: string | null
  issued_at: string | null
  downloadable: boolean
  original_document_id: string | null
}

export type CbaOrderDocumentTypeFilter = "receipt" | "invoice" | "credit_note"

export type CbaDocumentDownload = {
  url: string
  expires_at: string
}
