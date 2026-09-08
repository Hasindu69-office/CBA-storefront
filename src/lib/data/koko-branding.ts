"use server"

import { sdk } from "@lib/config"
import { cache } from "react"

type CmsSiteSetting = {
  group: string
  key: string
  value: unknown
}

type SiteSettingsResponse =
  | { success: true; data: { settings: CmsSiteSetting[] } }
  | { success: false; error?: { message?: string } }

export type KokoCheckoutBranding = {
  image_url: string
  image_alt_text: string
  label: string
}

type KokoAvailabilityResponse =
  | { success: true; data: { available: boolean; provider_id: string | null } }
  | { success: false; data?: { available?: boolean }; error?: { message?: string } }

const DEFAULT_BRANDING: KokoCheckoutBranding = {
  image_url: "",
  image_alt_text: "Koko Pay",
  label: "Koko Pay",
}

export const retrieveKokoCheckoutBranding = cache(
  async (): Promise<KokoCheckoutBranding> => {
    try {
      const response = await sdk.client.fetch<SiteSettingsResponse>(
        "/store/cba/v1/site-settings",
        { query: { groups: "checkout" }, cache: "no-store" }
      )
      if (!response.success) return DEFAULT_BRANDING
      const setting = response.data.settings.find(
        (row) => row.group === "checkout" && row.key === "koko"
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

export const retrieveKokoPaymentAvailability = cache(
  async (regionId: string): Promise<boolean> => {
    if (!regionId) return false
    try {
      const response = await sdk.client.fetch<KokoAvailabilityResponse>(
        "/store/cba/v1/payments/koko/availability",
        {
          query: { region_id: regionId },
          cache: "no-store",
        }
      )
      return Boolean(response.success && response.data.available)
    } catch {
      return false
    }
  }
)
