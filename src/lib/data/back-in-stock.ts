"use server"

import { sdk } from "@lib/config"
import { getLocale } from "@lib/data/locale-actions"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function requestBackInStock(
  _prevState: { status?: string; message?: string } | null,
  formData: FormData
) {
  const email = String(formData.get("email") ?? "").trim()
  const productId = String(formData.get("product_id") ?? "").trim()
  const variantId = String(formData.get("variant_id") ?? "").trim()
  if (!EMAIL_PATTERN.test(email)) {
    return { status: "error", message: "Enter a valid email address." }
  }
  if (!/^prod_[A-Za-z0-9_-]+$/.test(productId)) {
    return { status: "error", message: "Product selection is invalid." }
  }
  if (variantId && !/^variant_[A-Za-z0-9_-]+$/.test(variantId)) {
    return { status: "error", message: "Product selection is invalid." }
  }
  if (formData.get("consent") !== "on") {
    return { status: "error", message: "Consent is required for availability notifications." }
  }
  try {
    const locale = await getLocale()
    const response = await sdk.client.fetch<{ message?: string }>("/store/cba/v1/back-in-stock", {
      method: "POST",
      body: {
        email,
        product_id: productId,
        variant_id: variantId || null,
        locale,
        consent: true,
      },
      cache: "no-store",
    })
    return {
      status: "success",
      message: response.message ?? "If this item becomes available, we will send an email notification.",
    }
  } catch (error: any) {
    return {
      status: "error",
      message: error?.message ?? "We could not save this notification request.",
    }
  }
}
