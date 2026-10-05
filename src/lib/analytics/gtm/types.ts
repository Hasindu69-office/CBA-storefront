/** Plain dataLayer payload after sanitization. */
export type DataLayerValue = string | number | boolean | null

export type DataLayerPayload = Record<string, DataLayerValue>

export type VirtualPageViewPayload = {
  event: "virtualPageView"
  page_path: string
}
