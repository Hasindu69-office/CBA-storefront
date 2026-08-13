import "server-only"

import { sdk } from "@lib/config"

export type AuthProviderId = "google" | "facebook" | "apple"

export type AuthPageContent = {
  logo_url: string
  logo_alt_text: string
  login_title: string
  login_description: string
  register_title: string
  register_description: string
  promo_eyebrow: string
  promo_title: string
  promo_description: string
  promo_image_url: string
  promo_image_alt_text: string
  benefits: Array<{
    icon: "award" | "settings" | "support"
    title: string
    description: string
  }>
}

export type AuthSsoProviders = Record<
  AuthProviderId,
  {
    enabled: boolean
    label: string
  }
>

export type AccountAuthSettings = {
  content: AuthPageContent
  providers: AuthSsoProviders
}

type SiteSettingsResponse =
  | {
      success: true
      data: {
        settings: Array<{
          group: string
          key: string
          value: unknown
        }>
      }
    }
  | {
      success: false
      error: {
        message?: string
      }
    }

export const DEFAULT_AUTH_PAGE_CONTENT: AuthPageContent = {
  logo_url: "/images/ebizCBAlogo.png",
  logo_alt_text: "Ebiz by Ceylon Business Appliances",
  login_title: "Sign In",
  login_description: "Welcome back! Please sign in to your account.",
  register_title: "Create Account",
  register_description:
    "Register to manage orders, save products, and access business solutions.",
  promo_eyebrow: "Upgrade. Automate. Grow.",
  promo_title: "Smart Solutions for Efficient Business Operations",
  promo_description:
    "From advanced office equipment to intelligent automation - we power your business to work better.",
  promo_image_url: "/images/loginandregisterpage.png",
  promo_image_alt_text: "Office printer and business automation solutions",
  benefits: [
    {
      icon: "award",
      title: "Trusted Quality",
      description: "Reliable products from global leading brands.",
    },
    {
      icon: "settings",
      title: "Smarter Efficiency",
      description: "Automated solutions that improve productivity.",
    },
    {
      icon: "support",
      title: "Dedicated Support",
      description: "Expert support whenever you need us.",
    },
  ],
}

export const DEFAULT_AUTH_SSO_PROVIDERS: AuthSsoProviders = {
  google: { enabled: false, label: "Continue with Google" },
  facebook: { enabled: false, label: "Continue with Facebook" },
  apple: { enabled: false, label: "Continue with Apple" },
}

export async function retrieveAccountAuthSettings(): Promise<AccountAuthSettings> {
  return sdk.client
    .fetch<SiteSettingsResponse>("/store/cba/v1/site-settings", {
      query: { groups: "account" },
      cache: "no-store",
    })
    .then((payload) => {
      if (!payload.success) {
        throw new Error(payload.error?.message ?? "Account settings request failed.")
      }

      const settings = payload.data.settings
      const content = settings.find((item) => item.key === "auth_page_content")?.value
      const providers = settings.find((item) => item.key === "auth_sso_providers")?.value

      return {
        content: normalizeContent(content),
        providers: normalizeProviders(providers),
      }
    })
    .catch(() => ({
      content: DEFAULT_AUTH_PAGE_CONTENT,
      providers: DEFAULT_AUTH_SSO_PROVIDERS,
    }))
}

function normalizeContent(value: unknown): AuthPageContent {
  const data = objectValue(value)
  return {
    ...DEFAULT_AUTH_PAGE_CONTENT,
    ...data,
    benefits: normalizeBenefits(data.benefits),
  }
}

function normalizeProviders(value: unknown): AuthSsoProviders {
  const data = objectValue(value)
  return {
    google: { ...DEFAULT_AUTH_SSO_PROVIDERS.google, ...objectValue(data.google) },
    facebook: { ...DEFAULT_AUTH_SSO_PROVIDERS.facebook, ...objectValue(data.facebook) },
    apple: { ...DEFAULT_AUTH_SSO_PROVIDERS.apple, ...objectValue(data.apple) },
  }
}

function normalizeBenefits(value: unknown) {
  const rows = Array.isArray(value) ? value : []
  return DEFAULT_AUTH_PAGE_CONTENT.benefits.map((fallback, index) => ({
    ...fallback,
    ...objectValue(rows[index]),
  }))
}

function objectValue(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {}
}
