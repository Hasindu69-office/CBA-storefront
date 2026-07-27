"use client"

import {
  addWishlistItemsToCart,
  clearWishlist,
  removeWishlistItems,
  shareWishlist,
  type Wishlist,
  type WishlistItem,
} from "@lib/data/wishlist"
import { convertToLocale } from "@lib/util/money"
import { openSideCart } from "@lib/util/side-cart-event"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HeartIcon, ShoppingCartIcon } from "@modules/layout/components/cba-icons"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"

type WishlistTemplateProps = {
  wishlist: Wishlist | null
  countryCode: string
  errorMessage?: string
  shared?: boolean
  shareExpiresAt?: string
}

export default function WishlistTemplate({
  wishlist,
  countryCode,
  errorMessage,
  shared = false,
  shareExpiresAt,
}: WishlistTemplateProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [message, setMessage] = useState(errorMessage ?? "")
  const [messageType, setMessageType] = useState<"success" | "error">(
    errorMessage ? "error" : "success"
  )
  const [isPending, startTransition] = useTransition()

  const items = wishlist?.items ?? []
  const availableItems = items.filter(isAvailable)
  const selectedItems = items.filter((item) => selectedIds.includes(item.id))
  const selectedAvailableItems = selectedItems.filter(isAvailable)
  const totalValue = useMemo(() => wishlistTotal(items), [items])
  const currencyCode =
    items.find((item) => item.product_card?.price.currency_code)?.product_card
      ?.price.currency_code ?? "lkr"
  const allSelected = items.length > 0 && selectedIds.length === items.length

  function setStatus(type: "success" | "error", text: string) {
    setMessageType(type)
    setMessage(text)
  }

  function toggleItem(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : items.map((item) => item.id))
  }

  function removeSelected(ids = selectedIds) {
    if (shared) return
    if (!ids.length) {
      setStatus("error", "Select at least one wishlist item.")
      return
    }
    startTransition(async () => {
      const result = await removeWishlistItems(ids)
      setStatus(result.success ? "success" : "error", result.message)
      setSelectedIds([])
      router.refresh()
    })
  }

  function clearAll() {
    if (shared) return
    if (!items.length) {
      setStatus("error", "Wishlist is already empty.")
      return
    }
    startTransition(async () => {
      const result = await clearWishlist()
      setStatus(result.success ? "success" : "error", result.message)
      setSelectedIds([])
      router.refresh()
    })
  }

  function addItemsToCart(targetItems: WishlistItem[]) {
    const addable = targetItems.filter(isAvailable)
    if (!addable.length) {
      setStatus("error", "Select at least one available item.")
      return
    }
    openSideCart({ pendingMessage: "Adding item to cart.", refresh: false })
    startTransition(async () => {
      const result = await addWishlistItemsToCart({
        countryCode,
        items: addable.map((item) => ({
          itemId: item.id,
          variantId: item.variant_id,
        })),
      })
      setStatus(result.success ? "success" : "error", result.message)
      if (result.success) {
        openSideCart({ pendingMessage: "Updating cart.", refresh: true })
      } else {
        openSideCart({ pendingMessage: null, refresh: false })
      }
    })
  }

  function createShareLink() {
    if (shared) return
    if (!items.length) {
      setStatus("error", "Add items before sharing your wishlist.")
      return
    }
    startTransition(async () => {
      const result = await shareWishlist()
      if (!result.success) {
        setStatus("error", result.message)
        return
      }
      const url = `${window.location.origin}/wishlist/shared/${result.token}`
      await navigator.clipboard?.writeText(url).catch(() => null)
      setStatus(
        "success",
        `Share link copied. It expires on ${formatDate(result.expiresAt)}.`
      )
    })
  }

  return (
    <main className="bg-white text-[#171717]">
      <div className="content-container py-10 small:py-14">
        <div className="flex flex-col gap-4 small:flex-row small:items-end small:justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-tight small:text-[28px]">
              {shared ? "Shared Wishlist" : "My Wishlist"} ({items.length})
            </h1>
            <p className="mt-2 text-sm text-[#5f6673]">
              {shared
                ? "Products shared from this wishlist are ready to add to your cart."
                : "Save your favorite products and shop them anytime."}
            </p>
            {shared && shareExpiresAt && (
              <p className="mt-1 text-xs text-[#8a8f98]">
                Link expires {formatDate(shareExpiresAt)}
              </p>
            )}
          </div>
          {!shared && (
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <button
                type="button"
                onClick={createShareLink}
                disabled={isPending || !items.length}
                className="inline-flex items-center gap-2 text-[#4b5563] hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShareIcon />
                Share Wishlist
              </button>
            </div>
          )}
        </div>

        {message && (
          <p
            aria-live="polite"
            className={`mt-5 rounded-[6px] border px-4 py-3 text-sm ${
              messageType === "success"
                ? "border-green-100 bg-green-50 text-green-700"
                : "border-red-100 bg-red-50 text-red-700"
            }`}
          >
            {message}
          </p>
        )}

        {!items.length ? (
          <EmptyWishlist shared={shared} />
        ) : (
          <div className="mt-8 grid gap-5 large:grid-cols-[1fr_310px]">
            <section className="overflow-visible rounded-[8px] border border-[#e7e7e7] bg-white">
              {items.map((item) => (
                <WishlistRow
                  key={item.id}
                  item={item}
                  shared={shared}
                  checked={selectedIds.includes(item.id)}
                  pending={isPending}
                  onToggle={() => toggleItem(item.id)}
                  onAddToCart={() => addItemsToCart([item])}
                  onRemove={() => removeSelected([item.id])}
                  onMessage={setStatus}
                />
              ))}
              {!shared && (
                <div className="flex flex-col gap-3 border-t border-[#ededed] px-4 py-4 small:flex-row small:items-center small:justify-between">
                  <label className="inline-flex items-center gap-3 text-sm font-semibold text-[#4b5563]">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      disabled={isPending}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Select All
                  </label>
                  <button
                    type="button"
                    onClick={() => removeSelected()}
                    disabled={isPending || !selectedIds.length}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[6px] border border-[#e5e7eb] px-5 text-sm font-semibold text-[#4b5563] hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <TrashIcon />
                    Remove Selected
                  </button>
                </div>
              )}
            </section>

            <aside className="space-y-5">
              <div className="rounded-[8px] border border-[#e7e7e7] bg-white p-6 text-center">
                <h2 className="text-lg font-bold">Wishlist Summary</h2>
                <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-[#fff2e6] text-brand">
                  <ShoppingBagIcon />
                </div>
                <p className="mt-6 text-xl font-bold">
                  {items.length} {items.length === 1 ? "Item" : "Items"}
                </p>
                <p className="mt-2 text-sm font-semibold text-[#4b5563]">
                  {availableItems.length} available
                </p>
                <p className="mt-4 text-sm font-semibold text-[#4b5563]">
                  Total Value
                </p>
                <p className="mt-2 text-2xl font-black">
                  {convertToLocale({
                    amount: totalValue,
                    currency_code: currencyCode,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    addItemsToCart(
                      selectedAvailableItems.length
                        ? selectedAvailableItems
                        : availableItems
                    )
                  }
                  disabled={isPending || !availableItems.length}
                  className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-[6px] bg-brand px-4 text-sm font-bold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingCartIcon size={18} />
                  {selectedAvailableItems.length ? "Add Selected to Cart" : "Add All to Cart"}
                </button>
              </div>

              <div className="rounded-[8px] border border-[#e7e7e7] bg-white p-6">
                <div className="flex gap-4">
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#fff2e6] text-brand">
                    <HeartIcon size={20} />
                  </span>
                  <div>
                    <h2 className="font-bold">
                      {shared ? "Shared by wishlist" : "Save it for later"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#5f6673]">
                      {shared
                        ? "Only available products can be added to your cart from this shared page."
                        : "Items in your wishlist will be saved here. Add items and shop whenever you're ready."}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}

function WishlistRow({
  item,
  checked,
  pending,
  shared,
  onToggle,
  onAddToCart,
  onRemove,
  onMessage,
}: {
  item: WishlistItem
  checked: boolean
  pending: boolean
  shared: boolean
  onToggle: () => void
  onAddToCart: () => void
  onRemove: () => void
  onMessage: (type: "success" | "error", text: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const card = item.product_card
  const available = isAvailable(item)
  const price =
    card?.price.status === "available" && card.price.calculated_amount !== null
      ? convertToLocale({
          amount: card.price.calculated_amount,
          currency_code: card.price.currency_code,
          maximumFractionDigits: 2,
        })
      : "Contact for price"
  const productPath = card?.handle ? `/products/${card.handle}` : null

  async function copyProductLink() {
    if (!productPath) {
      onMessage("error", "Product link is unavailable.")
      setMenuOpen(false)
      return
    }

    const url = `${window.location.origin}${productPath}`
    try {
      await navigator.clipboard.writeText(url)
      onMessage("success", "Product link copied.")
    } catch {
      onMessage("error", "Product link could not be copied.")
    } finally {
      setMenuOpen(false)
    }
  }

  return (
    <article className="relative grid gap-4 border-b border-[#ededed] px-4 py-5 last:border-b-0 small:grid-cols-[24px_96px_1fr_160px_188px_34px] small:items-center">
      {!shared ? (
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          disabled={pending}
          aria-label={`Select ${card?.title ?? item.product_id}`}
          className="h-4 w-4 rounded border-gray-300"
        />
      ) : (
        <span />
      )}
      <div className="relative h-24 w-24 overflow-hidden rounded-[6px] bg-white">
        {card?.thumbnail?.url ? (
          <Image
            src={card.thumbnail.url}
            alt={card.thumbnail.alt || card.title}
            fill
            sizes="96px"
            className="object-contain p-3"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[#8a8f98]">
            No image
          </div>
        )}
      </div>
      <div className="min-w-0">
        {card?.handle ? (
          <LocalizedClientLink
            href={`/products/${card.handle}`}
            className="line-clamp-2 font-bold hover:text-brand"
          >
            {card.title}
          </LocalizedClientLink>
        ) : (
          <h2 className="line-clamp-2 font-bold">{item.product_id}</h2>
        )}
        <p className="mt-2 text-sm text-[#6b7280]">
          SKU: {card?.default_variant?.sku ?? "Not available"}
        </p>
      </div>
      <div>
        <p className="font-bold">{price}</p>
        <p
          className={`mt-2 text-sm font-semibold ${
            available ? "text-green-600" : "text-[#8a8f98]"
          }`}
        >
          {available ? "In Stock" : availabilityLabel(item.availability)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onAddToCart}
          disabled={pending || !available}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[6px] bg-brand px-4 text-sm font-bold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCartIcon size={16} />
          Add to Cart
        </button>
        {!shared && (
          <button
            type="button"
            onClick={onRemove}
            disabled={pending}
            aria-label={`Remove ${card?.title ?? item.product_id}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#6b7280] hover:bg-[#fff2e6] hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <TrashIcon />
          </button>
        )}
      </div>
      {!shared && (
        <div className="relative hidden small:block">
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            disabled={pending}
            aria-label={`More actions for ${card?.title ?? item.product_id}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#4b5563] hover:bg-[#f7f7f8] disabled:opacity-50"
          >
            <DotsIcon />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-[6px] border border-[#e5e7eb] bg-white py-1 text-sm shadow-[0_14px_34px_rgba(15,23,42,0.16)]"
            >
              {productPath ? (
                <LocalizedClientLink
                  href={productPath}
                  role="menuitem"
                  className="block px-4 py-2.5 text-left font-semibold text-[#374151] hover:bg-[#f7f7f8] hover:text-brand"
                  onClick={() => setMenuOpen(false)}
                >
                  View product
                </LocalizedClientLink>
              ) : (
                <span className="block px-4 py-2.5 font-semibold text-[#9ca3af]">
                  View product
                </span>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={copyProductLink}
                disabled={!productPath}
                className="block w-full px-4 py-2.5 text-left font-semibold text-[#374151] hover:bg-[#f7f7f8] hover:text-brand disabled:cursor-not-allowed disabled:text-[#9ca3af]"
              >
                Copy product link
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

function EmptyWishlist({ shared }: { shared: boolean }) {
  return (
    <div className="mt-8 rounded-[8px] border border-dashed border-[#d9dde3] bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff2e6] text-brand">
        <HeartIcon size={28} />
      </div>
      <h2 className="mt-5 text-xl font-bold">
        {shared ? "This shared wishlist is empty" : "Your wishlist is empty"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5f6673]">
        {shared
          ? "There are no products available from this shared wishlist."
          : "Browse the store and tap the heart icon to save products here."}
      </p>
      {!shared && (
        <LocalizedClientLink
          href="/store"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-[6px] bg-brand px-6 text-sm font-bold text-white hover:bg-brand-hover"
        >
          Continue Shopping
        </LocalizedClientLink>
      )}
    </div>
  )
}

function isAvailable(item: WishlistItem) {
  return Boolean(
    item.availability === "available" &&
      item.variant_id &&
      item.product_card?.inventory.purchasable &&
      item.product_card?.price.status === "available"
  )
}

function wishlistTotal(items: WishlistItem[]) {
  return items.reduce((sum, item) => {
    if (!isAvailable(item)) return sum
    return sum + (item.product_card?.price.calculated_amount ?? 0)
  }, 0)
}

function availabilityLabel(value: WishlistItem["availability"]) {
  if (value === "product_missing") return "Product unavailable"
  if (value === "variant_missing") return "Variant unavailable"
  return "Unavailable"
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "the configured expiry date"
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4" />
      <path d="m15.4 6.5-6.8 4" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  )
}

function ShoppingBagIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8h12l-1 13H7L6 8Z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </svg>
  )
}
