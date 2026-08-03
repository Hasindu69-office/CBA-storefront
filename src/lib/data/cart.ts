"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { getStoreCountryCode, localizedPath } from "@lib/util/routes"
import { listProductCardsByIds } from "@lib/data/tabbed-sale-products"
import {
  normalizePromotionCodes,
  safePromotionError,
} from "@lib/util/promotions"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeCartId,
  setCartId,
} from "./cookies"
import { getRegion } from "./regions"
import { getLocale } from "@lib/data/locale-actions"

const SAFE_MEDUSA_ID_PATTERN = /^[a-z]+_[A-Za-z0-9_-]+$/
const CART_TOTAL_FIELDS =
  "id,currency_code,email,region_id,*region,+region.automatic_taxes,total,subtotal,tax_total,discount_total,discount_subtotal,item_total,item_subtotal,item_tax_total,shipping_total,shipping_subtotal,shipping_tax_total,shipping_discount_total,original_total,original_tax_total,original_item_total,original_shipping_total,*items,+items.total,+items.subtotal,+items.tax_total,+items.is_tax_inclusive,*items.tax_lines,*items.adjustments,*items.product,*items.variant,*items.thumbnail,*items.metadata,*promotions,+promotions.is_tax_inclusive,*shipping_methods,+shipping_methods.name,+shipping_methods.tax_total,+shipping_methods.is_tax_inclusive,*shipping_methods.tax_lines,*shipping_methods.adjustments,*shipping_address,*billing_address,*payment_collection,*payment_collection.payment_sessions,*credit_lines"

function assertSafeMedusaId(id: string, label: string) {
  if (!SAFE_MEDUSA_ID_PATTERN.test(id)) {
    throw new Error(`${label} is invalid`)
  }
}

function assertSafeQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new Error("Quantity must be between 1 and 99")
  }
}

function stringField(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim()
}

function firstAvailableField(formData: FormData, names: string[]) {
  for (const name of names) {
    const value = stringField(formData, name)
    if (value) {
      return value
    }
  }
  return ""
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return {
    first_name: parts[0] ?? "",
    last_name: parts.slice(1).join(" ") || parts[0] || "",
  }
}

function validateCheckoutAddressPayload(payload: {
  first_name: string
  last_name: string
  email: string
  phone: string
  address_1: string
  city: string
  province: string
  postal_code: string
  country_code: string
}) {
  for (const [field, value] of Object.entries(payload)) {
    if (value.length > 160) {
      return `${field.replace(/_/g, " ")} is too long.`
    }
  }
  if (!payload.first_name || !payload.last_name) {
    return "Full name is required."
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return "Enter a valid email address."
  }
  if (!/^[0-9+\-\s()]{7,20}$/.test(payload.phone)) {
    return "Enter a valid phone number."
  }
  if (!payload.address_1) {
    return "Street address is required."
  }
  if (!payload.city) {
    return "City is required."
  }
  if (!payload.province) {
    return "District is required."
  }
  if (!/^[A-Za-z0-9\s-]{1,32}$/.test(payload.postal_code)) {
    return "Enter a valid postal code."
  }
  if (payload.country_code.toLowerCase() !== "lk") {
    return "Delivery is currently available only in Sri Lanka."
  }
  return null
}

function checkoutAddressData(formData: FormData) {
  const fullName = stringField(formData, "full_name")
  const splitName = splitFullName(fullName)
  const firstName =
    firstAvailableField(formData, ["shipping_address.first_name"]) ||
    splitName.first_name
  const lastName =
    firstAvailableField(formData, ["shipping_address.last_name"]) ||
    splitName.last_name

  const payload = {
    first_name: firstName,
    last_name: lastName,
    address_1: firstAvailableField(formData, ["shipping_address.address_1"]),
    address_2: firstAvailableField(formData, ["shipping_address.address_2"]),
    company: firstAvailableField(formData, ["shipping_address.company"]),
    postal_code: firstAvailableField(formData, [
      "shipping_address.postal_code",
    ]),
    city: firstAvailableField(formData, ["shipping_address.city"]),
    country_code:
      firstAvailableField(formData, ["shipping_address.country_code"]) || "lk",
    province: firstAvailableField(formData, ["shipping_address.province"]),
    phone: firstAvailableField(formData, ["shipping_address.phone"]),
  }
  const email = firstAvailableField(formData, ["email"])
  const deliveryInstructions = stringField(formData, "delivery_instructions")
  const validationError = validateCheckoutAddressPayload({
    ...payload,
    email,
  })

  if (validationError) {
    throw new Error(validationError)
  }

  const cartData = {
    shipping_address: payload,
    billing_address: payload,
    email,
    metadata: deliveryInstructions
      ? {
          cba_delivery_instructions: deliveryInstructions.slice(0, 500),
        }
      : undefined,
  } as any

  return cartData
}

/**
 * Retrieves a cart by its ID. If no ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to retrieve.
 * @returns The cart object if found, or null if not found.
 */
export async function retrieveCart(cartId?: string, fields?: string) {
  const id = cartId || (await getCartId())
  fields ??=
    CART_TOTAL_FIELDS

  if (!id) {
    return null
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("carts")),
  }

  return await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
      method: "GET",
      query: {
        fields,
      },
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ cart }: { cart: HttpTypes.StoreCart }) => cart)
    .catch(() => null)
}

export async function getOrSetCart(countryCode: string) {
  countryCode = getStoreCountryCode(countryCode)
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  let cart = await retrieveCart(undefined, "id,region_id")

  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!cart) {
    const locale = await getLocale()
    const cartResp = await sdk.store.cart.create(
      { region_id: region.id, locale: locale || undefined },
      {},
      headers
    )
    cart = cartResp.cart

    await setCartId(cart.id)

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  if (cart && cart?.region_id !== region.id) {
    await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, headers)
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  return cart
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, data, {}, headers)
    .then(async ({ cart }: { cart: HttpTypes.StoreCart }) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)

      return cart
    })
    .catch(medusaError)
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
}: {
  variantId: string
  quantity: number
  countryCode: string
}) {
  if (!variantId) {
    throw new Error("Missing variant ID when adding to cart")
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new Error("Invalid quantity when adding to cart")
  }

  countryCode = getStoreCountryCode(countryCode)

  const cart = await getOrSetCart(countryCode)

  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .createLineItem(
      cart.id,
      {
        variant_id: variantId,
        quantity,
      },
      {},
      headers
    )
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
      await calculateCartTaxesWhenReady(await retrieveCart(cart.id))
    })
    .catch(medusaError)
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when updating line item")
  }
  assertSafeMedusaId(lineId, "Line item ID")
  assertSafeQuantity(quantity)

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when updating line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .updateLineItem(cartId, lineId, { quantity }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
      await calculateCartTaxesWhenReady(await retrieveCart(cartId))
    })
    .catch(medusaError)
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item")
  }
  assertSafeMedusaId(lineId, "Line item ID")

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when deleting line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .deleteLineItem(cartId, lineId, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
      await calculateCartTaxesWhenReady(await retrieveCart(cartId))
    })
    .catch(medusaError)
}

export async function calculateCartTaxes(cartId?: string) {
  const id = cartId || (await getCartId())
  if (!id) {
    throw new Error("No existing cart found when refreshing taxes")
  }
  assertSafeMedusaId(id, "Cart ID")

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}/taxes`, {
      method: "POST",
      query: { fields: CART_TOTAL_FIELDS },
      headers,
      cache: "no-store",
    })
    .then(async ({ cart }) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return cart
    })
    .catch(medusaError)
}

async function calculateCartTaxesWhenReady(
  cart: HttpTypes.StoreCart | null | undefined
) {
  if (!cart?.id) {
    return null
  }
  const hasAddress =
    cart.shipping_address?.country_code?.toLowerCase() === "lk" &&
    Boolean(cart.shipping_address?.address_1)
  const hasShipping = Boolean(cart.shipping_methods?.length)
  const automaticTaxes = cart.region?.automatic_taxes === true

  if (!automaticTaxes || !hasAddress || !hasShipping) {
    return cart
  }

  return calculateCartTaxes(cart.id).catch(() => cart)
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  assertSafeMedusaId(cartId, "Cart ID")
  assertSafeMedusaId(shippingMethodId, "Shipping method ID")
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .addShippingMethod(cartId, { option_id: shippingMethodId }, {}, headers)
    .then(async (response) => {
      await calculateCartTaxesWhenReady(response.cart)
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return retrieveCart(cartId)
    })
    .catch(medusaError)
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: HttpTypes.StoreInitializePaymentSession
) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.payment
    .initiatePaymentSession(cart, data, {}, headers)
    .then(async (resp) => {
      await calculateCartTaxesWhenReady(cart)
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return resp
    })
    .catch(medusaError)
}

export async function applyPromotions(codes: string[]) {
  const cartId = await getCartId()
  const promoCodes = normalizePromotionCodes(codes)

  if (!cartId) {
    throw new Error("No existing cart found")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, { promo_codes: promoCodes }, {}, headers)
    .then(async (response) => {
      const updatedCart =
        response?.cart ?? (await retrieveCart(cartId, "*promotions"))
      const appliedCodes =
        updatedCart?.promotions
          ?.map((promotion) => promotion.code)
          .filter((code): code is string => Boolean(code))
          .map((code) => code.toUpperCase()) ?? []
      const missingCodes = promoCodes.filter(
        (code) => !appliedCodes.includes(code.toUpperCase())
      )

      if (missingCodes.length > 0) {
        throw new Error(
          missingCodes.length === 1
            ? "This coupon code is invalid or not eligible for your cart."
            : "One or more coupon codes are invalid or not eligible for your cart."
        )
      }

      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
      await calculateCartTaxesWhenReady(await retrieveCart(cartId))
    })
    .catch((error) => {
      throw safePromotionError(error)
    })
}

export async function applyGiftCard(code: string) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, { gift_cards: [{ code }] }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function removeDiscount(code: string) {
  // const cartId = getCartId()
  // if (!cartId) return "No cartId cookie found"
  // try {
  //   await deleteDiscount(cartId, code)
  //   revalidateTag("cart")
  // } catch (error: any) {
  //   throw error
  // }
}

export async function removeGiftCard(
  codeToRemove: string,
  giftCards: any[]
  // giftCards: GiftCard[]
) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, {
  //       gift_cards: [...giftCards]
  //         .filter((gc) => gc.code !== codeToRemove)
  //         .map((gc) => ({ code: gc.code })),
  //     }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function submitPromotionForm(
  currentState: unknown,
  formData: FormData
) {
  const code = String(formData.get("code") ?? "").trim()
  if (!code) {
    return "Enter a promotion code"
  }

  try {
    await applyPromotions([code])
  } catch (e: any) {
    return e.message
  }
}

export async function saveCheckoutDetails(
  currentState: unknown,
  formData: FormData
) {
  try {
    const cart = await updateCart(checkoutAddressData(formData))
    await calculateCartTaxesWhenReady(cart)
    return null
  } catch (e: any) {
    return e.message
  }
}

// TODO: Pass a POJO instead of a form entity here
export async function setAddresses(currentState: unknown, formData: FormData) {
  try {
    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }
    const cartId = await getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    const cart = await updateCart(checkoutAddressData(formData))
    await calculateCartTaxesWhenReady(cart)
  } catch (e: any) {
    return e.message
  }

  redirect(
    localizedPath(
      `/${formData.get("shipping_address.country_code")}/checkout?step=payment`
    )
  )
}

export async function addBundleToCart({
  items,
  countryCode,
}: {
  items: Array<{ variantId: string; quantity: number; productId: string }>
  countryCode: string
}) {
  const normalizedItems = items
    .map((item) => ({
      variantId: item.variantId,
      productId: item.productId,
      quantity: Number(item.quantity),
    }))
    .filter((item) => item.variantId && item.productId)

  if (!normalizedItems.length || normalizedItems.length > 6) {
    throw new Error("Invalid bundle selection.")
  }

  for (const item of normalizedItems) {
    if (
      !SAFE_MEDUSA_ID_PATTERN.test(item.variantId) ||
      !SAFE_MEDUSA_ID_PATTERN.test(item.productId)
    ) {
      throw new Error("Invalid bundle item.")
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      throw new Error("Invalid bundle quantity.")
    }
  }

  const productIds = Array.from(new Set(normalizedItems.map((item) => item.productId)))
  const productCards = await listProductCardsByIds(productIds).catch(() => [])
  const cardsByProductId = new Map(productCards.map((card) => [card.product_id, card]))

  for (const item of normalizedItems) {
    const card = cardsByProductId.get(item.productId)
    if (!card) {
      throw new Error("One or more bundle products are unavailable.")
    }

    if (card.default_variant?.id === item.variantId) {
      if (!card.inventory.purchasable || card.price.status !== "available") {
        throw new Error(`${card.title} is not available to purchase.`)
      }
    }
  }

  countryCode = getStoreCountryCode(countryCode)
  const cart = await getOrSetCart(countryCode)

  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const beforeCart = await retrieveCart(cart.id, "*items")
  const beforeLineIds = new Set(
    beforeCart?.items?.map((lineItem) => lineItem.id).filter(Boolean) ?? []
  )
  const addedLineIds: string[] = []

  try {
    for (const item of normalizedItems) {
      await sdk.store.cart.createLineItem(
        cart.id,
        {
          variant_id: item.variantId,
          quantity: item.quantity,
        },
        {},
        headers
      )

      const currentCart = await retrieveCart(cart.id, "*items")
      const newLineIds =
        currentCart?.items
          ?.map((lineItem) => lineItem.id)
          .filter((lineId): lineId is string => Boolean(lineId && !beforeLineIds.has(lineId))) ??
        []

      for (const lineId of newLineIds) {
        if (!addedLineIds.includes(lineId)) {
          addedLineIds.push(lineId)
          beforeLineIds.add(lineId)
        }
      }
    }
  } catch (error) {
    for (const lineId of addedLineIds) {
      await sdk.store.cart.deleteLineItem(cart.id, lineId, {}, headers).catch(() => null)
    }
    throw error instanceof Error ? error : new Error("Could not add bundle to cart.")
  }

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  const fulfillmentCacheTag = await getCacheTag("fulfillment")
  revalidateTag(fulfillmentCacheTag)
  await calculateCartTaxesWhenReady(await retrieveCart(cart.id))
}

/**
 * Places an order for a cart. If no cart ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to place an order for.
 * @returns The cart object if the order was successful, or null if not.
 */
export async function placeOrder(cartId?: string) {
  const id = cartId || (await getCartId())

  if (!id) {
    throw new Error("No existing cart found when placing an order")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const refreshedCart = await calculateCartTaxes(id).catch(() => null)
  if (!refreshedCart) {
    throw new Error("Could not refresh checkout totals. Review your cart and try again.")
  }

  const cartRes = await sdk.store.cart
    .complete(id, {}, headers)
    .then(async (cartRes) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return cartRes
    })
    .catch(medusaError)

  if (cartRes?.type === "order") {
    const countryCode =
      cartRes.order.shipping_address?.country_code?.toLowerCase()

    const orderCacheTag = await getCacheTag("orders")
    revalidateTag(orderCacheTag)

    removeCartId()
    redirect(localizedPath(`/${countryCode}/order/${cartRes?.order.id}/confirmed`))
  }

  return cartRes.cart
}

/**
 * Updates the countrycode param and revalidates the regions cache
 * @param regionId
 * @param countryCode
 */
export async function updateRegion(countryCode: string, currentPath: string) {
  countryCode = getStoreCountryCode(countryCode)
  const cartId = await getCartId()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (cartId) {
    const cart = await updateCart({ region_id: region.id })
    await calculateCartTaxesWhenReady(cart)
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  const regionCacheTag = await getCacheTag("regions")
  revalidateTag(regionCacheTag)

  const productsCacheTag = await getCacheTag("products")
  revalidateTag(productsCacheTag)

  redirect(localizedPath(`/${countryCode}${currentPath}`))
}

export async function listCartOptions() {
  const cartId = await getCartId()
  const headers = {
    ...(await getAuthHeaders()),
  }
  const next = {
    ...(await getCacheOptions("shippingOptions")),
  }

  return await sdk.client.fetch<{
    shipping_options: HttpTypes.StoreCartShippingOption[]
  }>("/store/shipping-options", {
    query: { cart_id: cartId },
    next,
    headers,
    cache: "force-cache",
  })
}
