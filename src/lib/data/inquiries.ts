"use server"

import { sdk } from "@lib/config"

export type ContactInquiryFormState = {
  status: "idle" | "success" | "error"
  message?: string
  error?: string
  fieldErrors?: Record<string, string>
}

type ContactInquiryResponse =
  | {
      success: true
      inquiry?: {
        reference?: string
        status?: string
        message?: string
      }
    }
  | {
      success: false
      error?: {
        message?: string
        fields?: Record<string, string>
        code?: string
      }
    }

const CONTACT_INQUIRY_CATEGORIES = [
  "general",
  "sales",
  "service",
  "warranty",
  "delivery",
  "billing",
  "corporate",
  "other",
] as const

const PREFERRED_CONTACT_METHODS = [
  "email",
  "phone",
  "whatsapp",
  "none",
] as const

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^(\+94|0)?7\d{8}$/

const CATEGORY_SET = new Set<string>(CONTACT_INQUIRY_CATEGORIES)
const METHOD_SET = new Set<string>(PREFERRED_CONTACT_METHODS)

export async function submitContactInquiry(
  _prevState: ContactInquiryFormState,
  formData: FormData
): Promise<ContactInquiryFormState> {
  const values = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    phone: String(formData.get("phone") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    subject: String(formData.get("subject") ?? "").trim(),
    message: String(formData.get("message") ?? "").trim(),
    preferred_contact_method: String(
      formData.get("preferred_contact_method") ?? "email"
    ).trim(),
    marketing_opt_in: formData.get("marketing_opt_in") === "on",
    honeypot: String(formData.get("company_website") ?? "").trim(),
  }

  const fieldErrors = validateContactInquiry(values)
  if (Object.keys(fieldErrors).length) {
    return {
      status: "error",
      error: "Please check the highlighted fields and try again.",
      fieldErrors,
    }
  }

  const body = {
    name: values.name,
    email: values.email,
    phone: values.phone || null,
    category: values.category,
    subject: values.subject,
    message: values.message,
    preferred_contact_method: values.preferred_contact_method,
    source_page: "/contact",
    customer_consent_to_contact: true as const,
    marketing_opt_in: values.marketing_opt_in,
    honeypot: values.honeypot || null,
  }

  try {
    const response = await sdk.client.fetch<ContactInquiryResponse>(
      "/store/cba/v1/inquiries/contact",
      {
        method: "POST",
        body,
        cache: "no-store",
      }
    )

    if (!response.success) {
      return {
        status: "error",
        error:
          response.error?.message ??
          "We could not send your message. Please try again later.",
        fieldErrors: response.error?.fields,
      }
    }

    return {
      status: "success",
      message:
        response.inquiry?.message ??
        "Thank you. Your message has been received and our team will get back to you soon.",
    }
  } catch (error: any) {
    const fields = extractFieldErrors(error)
    return {
      status: "error",
      error:
        error?.message && !/^bad request$/i.test(String(error.message))
          ? String(error.message)
          : "We could not send your message. Please try again later.",
      fieldErrors: fields,
    }
  }
}

function validateContactInquiry(values: {
  name: string
  email: string
  phone: string
  category: string
  subject: string
  message: string
  preferred_contact_method: string
}): Record<string, string> {
  const errors: Record<string, string> = {}

  if (values.name.length < 2 || values.name.length > 80) {
    errors.name = "Name must be between 2 and 80 characters."
  }
  if (/[<>]/.test(values.name)) {
    errors.name = "Name contains invalid characters."
  }

  if (!EMAIL_PATTERN.test(values.email) || values.email.length > 254) {
    errors.email = "Please enter a valid email address."
  }

  if (values.phone) {
    const digits = values.phone.replace(/[\s()-]/g, "")
    if (!PHONE_PATTERN.test(digits)) {
      errors.phone = "Please enter a valid Sri Lankan mobile number."
    }
  }

  if (!CATEGORY_SET.has(values.category)) {
    errors.category = "Please select a category."
  }

  if (values.subject.length < 5 || values.subject.length > 120) {
    errors.subject = "Subject must be between 5 and 120 characters."
  }
  if (/[<>]/.test(values.subject)) {
    errors.subject = "Subject contains invalid characters."
  }

  if (values.message.length < 10 || values.message.length > 2000) {
    errors.message = "Message must be between 10 and 2000 characters."
  }
  if (/[<>]/.test(values.message)) {
    errors.message = "Message contains invalid characters."
  }

  if (!METHOD_SET.has(values.preferred_contact_method)) {
    errors.preferred_contact_method = "Please select a preferred contact method."
  }

  return errors
}

function extractFieldErrors(error: unknown): Record<string, string> | undefined {
  if (!error || typeof error !== "object") return undefined
  const candidate = error as {
    fields?: Record<string, string>
    error?: { fields?: Record<string, string> }
  }
  if (candidate.fields && typeof candidate.fields === "object") {
    return candidate.fields
  }
  if (candidate.error?.fields && typeof candidate.error.fields === "object") {
    return candidate.error.fields
  }
  return undefined
}
