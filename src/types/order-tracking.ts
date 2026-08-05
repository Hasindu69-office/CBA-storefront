export type CbaTrackingLabel = {
  tracking_number: string | null
  tracking_url: string | null
  label_url: string | null
}

export type CbaOrderFulfillment = {
  id: string
  status: string
  created_at: string
  shipped_at: string | null
  delivered_at: string | null
  canceled_at: string | null
  provider_display_name: string | null
  items: Array<{
    line_item_id: string
    title: string
    quantity: number
    thumbnail: string | null
  }>
  labels: CbaTrackingLabel[]
}

export type CbaOrderTimelineItem = {
  id: string
  key: string
  title: string
  description: string | null
  occurred_at: string
  state: "complete" | "current" | "upcoming" | "cancelled" | "failed"
  source: "order" | "payment" | "fulfillment" | "shipment" | "manual"
  fulfillment_id: string | null
}

export type CbaStatusLabel = {
  key: string
  label: string
}

export type CbaCustomerOrderTracking = {
  order: {
    id: string
    display_id: number | string
    created_at: string
    currency_code: string
    status: string
    payment_status: string
    fulfillment_status: string
    email_masked?: string | null
  }
  items: Array<{
    id: string
    title: string
    variant_title: string | null
    thumbnail: string | null
    quantity: number
    unit_price: number
    total: number
  }>
  totals: {
    subtotal: number
    discount_total: number
    shipping_total: number
    tax_total: number
    total: number
  }
  addresses: {
    shipping: CbaSafeAddress | null
    billing: CbaSafeAddress | null
  }
  shipping_methods: Array<{
    id: string
    name: string | null
    amount: number
  }>
  payment: {
    status: CbaStatusLabel
    provider: string | null
    amount: number
    currency_code: string
  }
  fulfillments: CbaOrderFulfillment[]
  timeline: CbaOrderTimelineItem[]
  next_expected_step: {
    key: string
    title: string
    description: string | null
  } | null
}

export type CbaSafeAddress = {
  first_name: string | null
  last_name: string | null
  phone: string | null
  company: string | null
  address_1: string | null
  address_2: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  country_code: string
}

export type CbaAccountOrderListItem = {
  id: string
  display_id: number | string
  custom_display_id: string | null
  created_at: string
  updated_at: string
  currency_code: string
  total: number
  item_count: number
  order_status: CbaStatusLabel
  payment_status: CbaStatusLabel
  fulfillment_status: CbaStatusLabel
  thumbnail: string | null
  primary_item_title: string | null
  additional_item_count: number
  fulfillment?: {
    has_tracking?: boolean
    tracking_numbers?: string[]
  }
}

export type CbaAccountOrderDetail = CbaAccountOrderListItem & {
  items: Array<{
    line_item_id: string
    title: string | null
    variant_title: string | null
    thumbnail: string | null
    quantity: number
    unit_price: number
    total: number
  }>
  fulfillments?: CbaOrderFulfillment[]
  timeline?: CbaOrderTimelineItem[]
  next_expected_step?: CbaCustomerOrderTracking["next_expected_step"]
  payment?: CbaCustomerOrderTracking["payment"]
  shipping_address?: CbaSafeAddress | null
  billing_address?: CbaSafeAddress | null
  shipping_methods?: CbaCustomerOrderTracking["shipping_methods"]
  subtotal?: number
  tax_total?: number
  discount_total?: number
  shipping_total?: number
}
