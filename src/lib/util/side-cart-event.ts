import type { HttpTypes } from "@medusajs/types"

export const SIDE_CART_OPEN_EVENT = "cba:side-cart-open"
export const SIDE_CART_UPDATE_EVENT = "cba:side-cart-update"

export type SideCartOpenOptions = {
  pendingMessage?: string | null
  refresh?: boolean
  cart?: HttpTypes.StoreCart | null
}

export function openSideCart(options: SideCartOpenOptions = {}) {
  if (typeof window === "undefined") {
    return
  }

  if ("cart" in options) {
    notifyCartUpdated(options.cart ?? null)
  }

  window.dispatchEvent(
    new CustomEvent<SideCartOpenOptions>(SIDE_CART_OPEN_EVENT, {
      detail: options,
    })
  )
}

export function notifyCartUpdated(cart: HttpTypes.StoreCart | null) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(
    new CustomEvent<Pick<SideCartOpenOptions, "cart">>(SIDE_CART_UPDATE_EVENT, {
      detail: { cart },
    })
  )
}
