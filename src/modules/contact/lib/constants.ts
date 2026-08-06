export const CONTACT_INQUIRY_CATEGORIES = [
  "general",
  "sales",
  "service",
  "warranty",
  "delivery",
  "billing",
  "corporate",
  "other",
] as const

export const PREFERRED_CONTACT_METHODS = [
  "email",
  "phone",
  "whatsapp",
  "none",
] as const

export type ContactInquiryCategory =
  (typeof CONTACT_INQUIRY_CATEGORIES)[number]

export type PreferredContactMethod =
  (typeof PREFERRED_CONTACT_METHODS)[number]
