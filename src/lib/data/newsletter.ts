"use server"

import { sdk } from "@lib/config"
import { getLocale } from "@lib/data/locale-actions"

export type NewsletterFormState = {
  status: "idle" | "success" | "error"
  message?: string
  error?: string
}

type NewsletterResponse = {
  success?: boolean
  message?: string
  error?: {
    message?: string
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_EMAIL_LENGTH = 254
const CONSENT_VERSION = "2026-07-cba-marketing-v1"

export async function subscribeToNewsletter(
  _prevState: NewsletterFormState,
  formData: FormData
): Promise<NewsletterFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()

  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return {
      status: "error",
      error: "Please enter a valid email address.",
    }
  }

  try {
    const locale = await getLocale()
    const response = await sdk.client.fetch<NewsletterResponse>(
      "/store/cba/v1/newsletter/subscriptions",
      {
        method: "POST",
        body: {
          email,
          source: "footer",
          locale,
          consent_version: CONSENT_VERSION,
          marketing_consent: true,
        },
        cache: "no-store",
      }
    )

    return {
      status: "success",
      message:
        response.message ??
        "If the email address can receive newsletters, a confirmation email will be sent.",
    }
  } catch (error: any) {
    return {
      status: "error",
      error:
        error?.message ??
        "We could not submit your subscription. Please try again later.",
    }
  }
}

export async function confirmNewsletter(token: string) {
  if (!/^[A-Za-z0-9_-]{24,256}$/.test(token)) {
    return { status: "error" as const, message: "This newsletter confirmation link is invalid." }
  }
  try {
    await sdk.client.fetch("/store/cba/v1/newsletter/confirm", {
      method: "POST",
      body: { token },
      cache: "no-store",
    })
    return { status: "success" as const, message: "Your newsletter subscription is confirmed." }
  } catch (error: any) {
    return {
      status: "error" as const,
      message: error?.message ?? "This newsletter confirmation link is invalid or expired.",
    }
  }
}

export async function unsubscribeNewsletter(token: string, reason?: string) {
  if (!/^[A-Za-z0-9_-]{24,256}$/.test(token)) {
    return { status: "error" as const, message: "This unsubscribe link is invalid." }
  }
  try {
    await sdk.client.fetch("/store/cba/v1/newsletter/unsubscribe", {
      method: "POST",
      body: { token, reason },
      cache: "no-store",
    })
    return { status: "success" as const, message: "You have been unsubscribed from the newsletter." }
  } catch (error: any) {
    return {
      status: "error" as const,
      message: error?.message ?? "This unsubscribe link is invalid or expired.",
    }
  }
}
