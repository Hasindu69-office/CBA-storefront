import type { HttpTypes } from "@medusajs/types"

export const PICKUP_PROFILE_TYPE = "pickup-only"
export const PICKUP_FULFILLMENT_TYPE = "pickup"
export const PICKUP_PROVIDER_ID = "manual_manual"
export const DOMEX_PROVIDER_ID = "cba-domex_standard"

export type FulfillmentKind = "delivery" | "pickup"
export type FulfillmentMode = "delivery-only" | "pickup-only" | "mixed"

export type FulfillmentLocationAddress = {
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country_code?: string | null
}

export type CbaCartLineItem = HttpTypes.StoreCartLineItem & {
  variant?:
    | (HttpTypes.StoreProductVariant & {
        product?:
          | (HttpTypes.StoreProduct & {
              shipping_profile?: { id: string; type?: string | null } | null
            })
          | null
      })
    | null
}

export type CbaShippingOption = HttpTypes.StoreCartShippingOption & {
  provider_id?: string | null
  shipping_profile_id: string
  data?: Record<string, unknown> | null
  insufficient_inventory?: boolean
  service_zone?: {
    fulfillment_set?: {
      type?: string | null
      location?: {
        id?: string | null
        name?: string | null
        address?: FulfillmentLocationAddress | null
      } | null
    } | null
  } | null
}

export type FulfillmentPlanGroup = {
  profileId: string
  profileType: string
  kind: FulfillmentKind
  items: CbaCartLineItem[]
  options: CbaShippingOption[]
  eligibleOptions: CbaShippingOption[]
  selectedOption: CbaShippingOption | null
  configurationError: string | null
}

export type FulfillmentPlan = {
  mode: FulfillmentMode
  groups: FulfillmentPlanGroup[]
  isComplete: boolean
  selectedOptionIds: string[]
}

type FulfillmentLine = {
  requires_shipping?: boolean | null
  variant?: {
    product?: {
      shipping_profile?: { type?: string | null } | null
    } | null
  } | null
  product?: {
    shipping_profile?: { type?: string | null } | null
  } | null
}

/**
 * Derives the customer-facing fulfillment mode from product shipping profiles.
 * This intentionally uses product policy rather than prices: a zero-priced pickup
 * option is self collection, not free delivery.
 */
export function deriveFulfillmentModeFromItems(
  items?: readonly unknown[] | null
): FulfillmentMode {
  let hasPickup = false
  let hasDelivery = false

  for (const rawItem of items ?? []) {
    const item = rawItem as FulfillmentLine
    if (item.requires_shipping === false) continue
    const profile =
      item.variant?.product?.shipping_profile ?? item.product?.shipping_profile
    if (profile?.type === PICKUP_PROFILE_TYPE) {
      hasPickup = true
    } else {
      hasDelivery = true
    }
  }

  return hasPickup && hasDelivery
    ? "mixed"
    : hasPickup
    ? "pickup-only"
    : "delivery-only"
}

/** Fallback for order projections that don't expose product shipping profiles. */
export function deriveFulfillmentModeFromMethodNames(
  methods?: Array<{ name?: string | null }> | null
): FulfillmentMode {
  const selected = (methods ?? []).filter((method) => Boolean(method.name))
  const hasPickup = selected.some((method) =>
    /pickup|pick-up|collection/i.test(method.name ?? "")
  )
  const hasDelivery = selected.some(
    (method) => !/pickup|pick-up|collection/i.test(method.name ?? "")
  )
  return hasPickup && hasDelivery
    ? "mixed"
    : hasPickup
    ? "pickup-only"
    : "delivery-only"
}

export function resolveFulfillmentMode({
  items,
  shippingMethods,
}: {
  items?: readonly unknown[] | null
  shippingMethods?: Array<{ name?: string | null }> | null
}): FulfillmentMode {
  const hasProfileData = (items ?? []).some((rawItem) => {
    const item = rawItem as FulfillmentLine
    return (
      item.variant?.product?.shipping_profile || item.product?.shipping_profile
    )
  })
  return hasProfileData
    ? deriveFulfillmentModeFromItems(items)
    : deriveFulfillmentModeFromMethodNames(shippingMethods)
}

export function buildFulfillmentPlan(
  cart: Pick<HttpTypes.StoreCart, "items" | "shipping_methods">,
  shippingOptions: HttpTypes.StoreCartShippingOption[]
): FulfillmentPlan {
  const optionList = shippingOptions as CbaShippingOption[]
  const selectedIds = new Set(
    (cart.shipping_methods ?? [])
      .map((method) => method.shipping_option_id)
      .filter((id): id is string => Boolean(id))
  )
  const groupedItems = new Map<
    string,
    { profileType: string; kind: FulfillmentKind; items: CbaCartLineItem[] }
  >()

  for (const item of (cart.items ?? []) as CbaCartLineItem[]) {
    if (item.requires_shipping === false) continue
    const profile = item.variant?.product?.shipping_profile
    if (!profile?.id) continue
    const profileType = profile.type || "default"
    const existing = groupedItems.get(profile.id)
    if (existing) {
      existing.items.push(item)
    } else {
      groupedItems.set(profile.id, {
        profileType,
        kind: profileType === PICKUP_PROFILE_TYPE ? "pickup" : "delivery",
        items: [item],
      })
    }
  }

  const groups = Array.from(groupedItems.entries()).map(
    ([profileId, group]): FulfillmentPlanGroup => {
      const options = optionList.filter(
        (option) =>
          option.shipping_profile_id === profileId &&
          optionMatchesKind(option, group.kind)
      )
      const eligibleOptions = options.filter(
        (option) =>
          !option.insufficient_inventory &&
          (group.kind !== "pickup" ||
            hasCompletePickupAddress(pickupAddress(option)))
      )
      const selectedOption =
        eligibleOptions.find((option) => selectedIds.has(option.id)) ?? null

      return {
        profileId,
        profileType: group.profileType,
        kind: group.kind,
        items: group.items,
        options,
        eligibleOptions,
        selectedOption,
        configurationError: groupConfigurationError(
          group.kind,
          options,
          eligibleOptions
        ),
      }
    }
  )

  const hasPickup = groups.some((group) => group.kind === "pickup")
  const hasDelivery = groups.some((group) => group.kind === "delivery")

  return {
    mode:
      hasPickup && hasDelivery
        ? "mixed"
        : hasPickup
        ? "pickup-only"
        : "delivery-only",
    groups,
    isComplete:
      groups.length > 0 &&
      groups.every((group) => Boolean(group.selectedOption)),
    selectedOptionIds: groups
      .map((group) => group.selectedOption?.id)
      .filter((id): id is string => Boolean(id)),
  }
}

export function pickupAddress(option: CbaShippingOption) {
  return option.service_zone?.fulfillment_set?.location?.address ?? null
}

export function formatPickupAddress(option: CbaShippingOption) {
  const address = pickupAddress(option)
  if (!address) return ""
  return [
    address.address_1,
    address.address_2,
    address.city,
    address.province,
    address.postal_code,
    address.country_code?.toUpperCase(),
  ]
    .filter(Boolean)
    .join(", ")
}

export function hasCompletePickupAddress(
  address?: FulfillmentLocationAddress | null
) {
  if (!address) return false
  return ["address_1", "city", "province", "postal_code", "country_code"].every(
    (field) => {
      const value = address[field as keyof FulfillmentLocationAddress]
      return typeof value === "string" && value.trim().length > 0
    }
  )
}

function optionMatchesKind(option: CbaShippingOption, kind: FulfillmentKind) {
  const isPickup =
    option.service_zone?.fulfillment_set?.type === PICKUP_FULFILLMENT_TYPE
  return kind === "pickup"
    ? isPickup && option.provider_id === PICKUP_PROVIDER_ID
    : !isPickup && isEligibleDeliveryOption(option)
}

export function isTestDeliveryOption(option: CbaShippingOption) {
  return (
    process.env.NODE_ENV !== "production" &&
    option.provider_id === PICKUP_PROVIDER_ID &&
    option.data?.cba_test_fixture === true
  )
}

function isEligibleDeliveryOption(option: CbaShippingOption) {
  return (
    option.provider_id === DOMEX_PROVIDER_ID || isTestDeliveryOption(option)
  )
}

function groupConfigurationError(
  kind: FulfillmentKind,
  options: CbaShippingOption[],
  eligibleOptions: CbaShippingOption[]
) {
  if (!options.length) {
    return kind === "pickup"
      ? "No store pickup location is configured for these items."
      : "No Domex delivery option is configured for these items."
  }
  if (eligibleOptions.length) return null
  if (options.every((option) => option.insufficient_inventory)) {
    return "This fulfillment option no longer has enough inventory for your cart."
  }
  if (kind === "pickup") {
    return "The pickup location address is incomplete. Please contact CBA for assistance."
  }
  return "No eligible delivery option is currently available."
}
