export const WISHLIST_COUNT_UPDATE_EVENT = "cba:wishlist-count-update"

export type WishlistCountUpdateOptions = {
  count: number
}

export function notifyWishlistCountUpdated(count: number) {
  if (typeof window === "undefined" || !Number.isInteger(count) || count < 0) {
    return
  }

  window.dispatchEvent(
    new CustomEvent<WishlistCountUpdateOptions>(WISHLIST_COUNT_UPDATE_EVENT, {
      detail: { count },
    })
  )
}
