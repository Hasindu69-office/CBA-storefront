export type CbaReturnEligibility = {
  available: boolean
  /** e.g. active_request_exists | no_eligible_action | order_already_refunded */
  reason: string | null
  actions?: string[]
  active_requests?: Array<{
    request_no: string
    request_type: string
    status: string
  }>
  item_eligibility?: Array<{
    order_item_id: string
    max_quantity: number
    eligible: boolean
  }>
  disclaimer?: string
}

export type CbaReturnIntakeRequestType =
  | "return"
  | "refund_review"
  | "exchange"
  | "cancellation"
  | "claim_refund"
  | "claim_replace"
  | "warranty"

export type CbaReturnIntakeListItem = {
  request_no: string
  request_type: string
  status: string
  status_label: string
  resolution_outcome?: string | null
  order_id: string
  order_display_id: string | null
  submitted_at: string | null
  next_action: string | null
}

export type CbaReturnIntakeEvidence = {
  id: string
  evidence_type: string
  original_file_name: string
  content_type: string
  size_bytes: number
  created_at: string | null
}

export type CbaReturnIntakeDetail = CbaReturnIntakeListItem & {
  preferred_resolution: string | null
  customer_reason_code: string | null
  customer_message: string | null
  customer_visible_note: string | null
  eligibility_state: string
  eligibility_summary: string | null
  items: Array<{
    order_item_id: string
    title: string
    variant_title: string | null
    sku: string | null
    quantity_requested: number
    reason_code: string | null
    condition_code: string | null
    note: string | null
  }>
  timeline: Array<{
    event_type: string
    message: string | null
    created_at: string | null
  }>
  evidence: CbaReturnIntakeEvidence[]
  native_operation: {
    type: string
    id: string | null
  } | null
}

export type CbaReturnIntakeUploadPolicy = {
  max_files: number
  max_file_bytes: number
  max_total_bytes: number
  allowed_types: string[]
}

export type CbaReturnIntakeEligibilityPreview = {
  state: string
  code: string | null
  summary: string
  requires_manual_review: boolean
  evidence_requirements: string[]
  evidence_required?: boolean
  allowed_resolution_types: string[]
  upload_policy?: CbaReturnIntakeUploadPolicy
  items: Array<{
    order_item_id: string
    max_quantity: number
    eligible: boolean
    reason: string | null
  }>
}
