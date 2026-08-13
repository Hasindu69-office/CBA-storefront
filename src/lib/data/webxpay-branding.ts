"use server"

import { sdk } from "@lib/config"
import { cache } from "react"

type CmsSiteSetting = {
  group: string
  key: string
  value: unknown
}

type SiteSettingsResponse =
  | {
      success: true
      data: {
        settings: CmsSiteSetting[]
      }
    }
  | {
      success: false
      error?: {
        message?: string
      }
    }

export type WebxpayCheckoutBranding = {
  image_url: string
  image_alt_text: string
  label: string
}

const DEFAULT_BRANDING: WebxpayCheckoutBranding = {
  image_url: "",
  image_alt_text: "WEBXPAY Secure Payment",
  label: "WEBXPAY Secure Payment",
}

export const retrieveWebxpayCheckoutBranding = cache(
  async (): Promise<WebxpayCheckoutBranding> => {
    try {
      const response = await sdk.client.fetch<SiteSettingsResponse>(
        "/store/cba/v1/site-settings",
        {
          query: { groups: "checkout" },
          cache: "no-store",
        }
      )
      if (!response.success) {
        return DEFAULT_BRANDING
      }
      const setting = response.data.settings.find(
        (row) => row.group === "checkout" && row.key === "webxpay"
      )
      const value = (setting?.value ?? {}) as Record<string, unknown>
      return {
        image_url: String(value.image_url ?? "").trim(),
        image_alt_text:
          String(value.image_alt_text ?? DEFAULT_BRANDING.image_alt_text).trim() ||
          DEFAULT_BRANDING.image_alt_text,
        label:
          String(value.label ?? DEFAULT_BRANDING.label).trim() ||
          DEFAULT_BRANDING.label,
      }
    } catch {
      return DEFAULT_BRANDING
    }
  }
)
