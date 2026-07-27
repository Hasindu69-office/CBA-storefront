export const SIDE_CART_OPEN_EVENT = "cba:side-cart-open"

export type SideCartOpenOptions = {
  pendingMessage?: string | null
  refresh?: boolean
}

export function openSideCart(options: SideCartOpenOptions = {}) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(
    new CustomEvent<SideCartOpenOptions>(SIDE_CART_OPEN_EVENT, {
      detail: options,
    })
  )
}
