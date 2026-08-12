"use client"

import { Dialog, Transition } from "@headlessui/react"
import { applyPromotions, deleteLineItem, updateLineItem } from "@lib/data/cart"
import { notify } from "@lib/notifications"
import {
  hasAutomaticPromotions,
  listAllPromotionCodes,
  listManualPromotionCodes,
  manualCodesWithNewCoupon,
  manualCodesWithoutCoupon,
} from "@lib/util/coupon-promotions"
import { convertToLocale } from "@lib/util/money"
import { mapAuthoritativeTotals } from "@lib/util/cart-totals"
import {
  PROMOTION_CODE_MAX_COUNT,
  PROMOTION_CODE_MAX_LENGTH,
  validatePromotionCode,
} from "@lib/util/promotions"
import {
  SIDE_CART_OPEN_EVENT,
  type SideCartOpenOptions,
} from "@lib/util/side-cart-event"
import {
  ArrowRight,
  CheckCircleSolid,
  InformationCircle,
  LockClosedSolid,
  Minus,
  Plus,
  Tag,
  Trash,
  TruckFast,
  XMark,
} from "@medusajs/icons"
import {
  HttpTypes,
  StoreCartShippingOption,
  StorePrice,
} from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import { ShoppingCartIcon } from "@modules/layout/components/cba-icons"
import Thumbnail from "@modules/products/components/thumbnail"
import { usePathname, useRouter } from "next/navigation"
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"

type SideCartProps = {
  cart?: HttpTypes.StoreCart | null
  shippingOptions?: StoreCartShippingOption[]
  wishlistCount?: number
}
type CartPromotion = NonNullable<HttpTypes.StoreCart["promotions"]>[number]

const MIN_QUANTITY = 1
const MAX_QUANTITY = 99

function money(amount: number | null | undefined, currencyCode: string) {
  return convertToLocale({
    amount: amount ?? 0,
    currency_code: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function getItemCount(cart?: HttpTypes.StoreCart | null) {
  return cart?.items?.reduce((total, item) => total + item.quantity, 0) ?? 0
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  return !cart?.shipping_address?.address_1 || !cart.email
    ? "address"
    : "payment"
}

function clampQuantity(quantity: number) {
  if (!Number.isInteger(quantity)) {
    return MIN_QUANTITY
  }

  return Math.min(Math.max(quantity, MIN_QUANTITY), MAX_QUANTITY)
}

function productSubtitle(item: HttpTypes.StoreCartLineItem) {
  const category =
    item.variant?.product?.categories?.[0]?.name ||
    item.product_collection ||
    item.product_type

  return category || item.product_subtitle || item.variant?.product?.subtitle
}

function computeFreeShippingTarget(
  cart: HttpTypes.StoreCart,
  shippingOptions: StoreCartShippingOption[]
) {
  const currentAmount = cart.item_total ?? cart.item_subtotal ?? cart.subtotal ?? 0

  return shippingOptions
    .flatMap((shippingOption) =>
      (shippingOption.prices ?? [])
        .filter(
          (price) =>
            price.currency_code === cart.currency_code &&
            price.amount === 0 &&
            price.price_rules?.some((rule) => rule.attribute === "item_total")
        )
        .map((price) => buildFreeShippingTarget(currentAmount, price))
    )
    .filter(Boolean)[0]
}

function buildFreeShippingTarget(currentAmount: number, price: StorePrice) {
  const priceRule = price.price_rules?.find(
    (rule) => rule.attribute === "item_total"
  )
  const targetAmount = Number(priceRule?.value)

  if (!priceRule || !Number.isFinite(targetAmount) || targetAmount <= 0) {
    return null
  }

  const targetReached =
    priceRule.operator === "gt"
      ? currentAmount > targetAmount
      : priceRule.operator === "gte"
      ? currentAmount >= targetAmount
      : priceRule.operator === "lt"
      ? currentAmount < targetAmount
      : priceRule.operator === "lte"
      ? currentAmount <= targetAmount
      : currentAmount === targetAmount

  return {
    targetAmount,
    targetReached,
    targetRemaining: targetReached ? 0 : Math.max(targetAmount - currentAmount, 0),
    progress: Math.min((currentAmount / targetAmount) * 100, 100),
  }
}

export default function SideCart({
  cart,
  shippingOptions = [],
}: SideCartProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const pathname = usePathname()
  const itemCount = getItemCount(cart)
  const cartSignature = `${cart?.id ?? "none"}:${itemCount}:${cart?.total ?? 0}`
  const previousCartSignature = useRef(cartSignature)

  useEffect(() => {
    const openCart = (event: Event) => {
      const detail = (event as CustomEvent<SideCartOpenOptions>).detail ?? {}

      if ("pendingMessage" in detail) {
        setPendingMessage(detail.pendingMessage ?? null)
      }

      if (detail.refresh ?? true) {
        router.refresh()
      }

      setIsOpen(true)
    }

    window.addEventListener(SIDE_CART_OPEN_EVENT, openCart)

    return () => {
      window.removeEventListener(SIDE_CART_OPEN_EVENT, openCart)
    }
  }, [router])

  useEffect(() => {
    if (previousCartSignature.current !== cartSignature) {
      previousCartSignature.current = cartSignature
      setPendingMessage(null)
    }
  }, [cartSignature])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex min-w-[38px] flex-col items-center gap-0.5 text-center transition-opacity hover:opacity-80 xsmall:min-w-[42px] small:flex-row small:gap-3 small:text-left"
        aria-label={`Open cart with ${itemCount} ${
          itemCount === 1 ? "item" : "items"
        }`}
        data-testid="nav-cart-link"
      >
        <span className="relative block">
          <ShoppingCartIcon
            size={23}
            strokeWidth={1.5}
            className="h-[23px] w-[23px] text-black small:h-[26px] small:w-[26px]"
          />
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-white small:h-5 small:min-w-5 small:text-[11px]">
            {itemCount}
          </span>
        </span>
        <div className="leading-tight">
          <p className="text-[13px] font-medium text-black small:hidden medium:block medium:text-[15px] medium:font-semibold">
            Cart
          </p>
          <p className="mt-0.5 hidden text-[12px] text-gray-400 medium:block">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[90]" onClose={setIsOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="flex min-h-full justify-end">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel
                  className="flex h-screen w-full max-w-[520px] flex-col overflow-hidden rounded-l-none bg-white shadow-2xl small:rounded-l-lg"
                  data-testid="side-cart-drawer"
                >
                  <SideCartDrawer
                    cart={cart}
                    shippingOptions={shippingOptions}
                    itemCount={itemCount}
                    pendingMessage={pendingMessage}
                    onClose={() => setIsOpen(false)}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

function SideCartDrawer({
  cart,
  shippingOptions,
  itemCount,
  pendingMessage,
  onClose,
}: {
  cart?: HttpTypes.StoreCart | null
  shippingOptions: StoreCartShippingOption[]
  itemCount: number
  pendingMessage: string | null
  onClose: () => void
}) {
  const router = useRouter()
  const [mutationCount, setMutationCount] = useState(0)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [isCouponPending, startCouponTransition] = useTransition()
  const isMutating = mutationCount > 0 || isCouponPending
  const hasItems = Boolean(cart?.items?.length)

  const sortedItems = useMemo(
    () =>
      [...(cart?.items ?? [])].sort((a, b) =>
        (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
      ),
    [cart?.items]
  )

  const setMutating = (active: boolean) => {
    setMutationCount((current) => Math.max(0, current + (active ? 1 : -1)))
  }

  const applyCoupon = (code: string) => {
    const allPromotionCodes = listAllPromotionCodes(cart?.promotions)
    const result = validatePromotionCode(code, allPromotionCodes)
    const normalizedCode = result.code

    setCouponError(null)

    if (result.error) {
      setCouponError(result.error)
      return
    }

    startCouponTransition(async () => {
      const toastId = `side-cart-coupon:${normalizedCode}`
      notify.loading("Applying coupon...", { id: toastId })
      try {
        await applyPromotions(manualCodesWithNewCoupon(cart?.promotions, normalizedCode))
        router.refresh()
        notify.success("Coupon applied.", { id: toastId })
      } catch (error) {
        notify.error(error, "Could not apply coupon.", { id: toastId })
        setCouponError(
          error instanceof Error ? error.message : "Could not apply coupon."
        )
      }
    })
  }

  const removeCoupon = (code: string) => {
    setCouponError(null)
    startCouponTransition(async () => {
      const toastId = `side-cart-coupon-remove:${code}`
      notify.loading("Removing coupon...", { id: toastId })
      try {
        await applyPromotions(manualCodesWithoutCoupon(cart?.promotions, code))
        router.refresh()
        notify.success("Coupon removed.", { id: toastId })
      } catch (error) {
        notify.error(error, "Could not remove coupon.", { id: toastId })
        setCouponError(
          error instanceof Error ? error.message : "Could not remove coupon."
        )
      }
    })
  }

  return (
    <>
      <div className="shrink-0 px-5 pb-2 pt-5 small:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <ShoppingCartIcon size={22} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <Dialog.Title className="text-[22px] font-bold leading-7 text-[#111827]">
                Your Cart ({itemCount})
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[13px] leading-[18px] text-[#596070]">
                Almost there! Review your items and proceed to checkout.
              </Dialog.Description>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[#111827] transition hover:bg-gray-50"
            aria-label="Close cart"
            data-testid="side-cart-close"
          >
            <XMark />
          </button>
        </div>
        <div className="mt-4 h-px w-14 bg-brand" />
        {pendingMessage && (
          <div
            className="mt-3 flex items-center gap-2 rounded-md border border-brand/20 bg-brand/10 px-3 py-2 text-[12px] font-semibold text-brand"
            role="status"
            aria-live="polite"
          >
            <Spinner />
            {pendingMessage}
          </div>
        )}
      </div>

      {hasItems && cart ? (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2 small:px-6">
            <div className="flex flex-col gap-2.5">
              {sortedItems.map((item) => (
                <SideCartItem
                  key={item.id}
                  item={item}
                  currencyCode={cart.currency_code}
                  disabled={isMutating}
                  onMutatingChange={setMutating}
                  onUpdated={() => router.refresh()}
                />
              ))}
            </div>
          </div>

          <div className="shrink-0 border-t border-gray-100 bg-white px-5 pb-5 pt-3 shadow-[0_-8px_20px_rgba(17,24,39,0.04)] small:px-6">
            <FreeShippingStrip cart={cart} shippingOptions={shippingOptions} />
            <SideCartCouponForm
              promotions={cart.promotions ?? []}
              disabled={isMutating}
              error={couponError}
              onApply={applyCoupon}
              onRemove={removeCoupon}
              isPending={isCouponPending}
            />
            <SideCartSummary cart={cart} disabled={isMutating} onClose={onClose} />
          </div>
        </>
      ) : pendingMessage ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Spinner />
          </div>
          <p className="mt-5 text-[18px] font-bold text-[#111827]">
            Updating your cart
          </p>
          <p className="mt-2 max-w-[280px] text-[13px] leading-5 text-[#6b7280]">
            Your item is being added. The cart will update in a moment.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand">
            <ShoppingCartIcon size={28} strokeWidth={1.8} />
          </div>
          <p className="mt-5 text-[18px] font-bold text-[#111827]">
            Your shopping cart is empty.
          </p>
          <p className="mt-2 max-w-[280px] text-[13px] leading-5 text-[#6b7280]">
            Add products to your cart and review them here before checkout.
          </p>
          <LocalizedClientLink
            href="/store"
            onClick={onClose}
            className="mt-7 inline-flex h-12 items-center justify-center rounded-md bg-brand px-6 text-[15px] font-semibold text-white transition hover:bg-brand-hover"
          >
            Explore products
          </LocalizedClientLink>
        </div>
      )}
    </>
  )
}

function SideCartItem({
  item,
  currencyCode,
  disabled,
  onMutatingChange,
  onUpdated,
}: {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
  disabled: boolean
  onMutatingChange: (active: boolean) => void
  onUpdated: () => void
}) {
  const [draftQuantity, setDraftQuantity] = useState(item.quantity)
  const [isPending, setIsPending] = useState(false)
  const [isRemoved, setIsRemoved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mutationInFlight = useRef(false)
  const subtitle = productSubtitle(item)

  useEffect(() => {
    setDraftQuantity(item.quantity)
  }, [item.quantity])

  const mutate = async (
    action: () => Promise<void>,
    removeOnSuccess = false,
    successMessage = "Cart updated."
  ) => {
    if (mutationInFlight.current) {
      return
    }

    const toastId = `side-cart-item:${item.id}`
    notify.loading(removeOnSuccess ? "Removing item..." : "Updating cart...", {
      id: toastId,
    })
    mutationInFlight.current = true
    setError(null)
    setIsPending(true)
    onMutatingChange(true)

    try {
      await action()
      if (removeOnSuccess) {
        setIsRemoved(true)
        mutationInFlight.current = false
        onMutatingChange(false)
      }
      onUpdated()
      notify.success(successMessage, { id: toastId })
    } catch (err) {
      notify.error(err, "Could not update item.", { id: toastId })
      setError(err instanceof Error ? err.message : "Could not update item.")
      setDraftQuantity(item.quantity)
      setIsRemoved(false)
      setIsPending(false)
      mutationInFlight.current = false
      onMutatingChange(false)
      return
    } finally {
      if (!removeOnSuccess) {
        setIsPending(false)
        mutationInFlight.current = false
        onMutatingChange(false)
      }
    }
  }

  const changeQuantity = (nextQuantity: number) => {
    const quantity = clampQuantity(nextQuantity)

    if (quantity === item.quantity || isPending || mutationInFlight.current) {
      setDraftQuantity(quantity)
      return
    }

    setDraftQuantity(quantity)
    mutate(() =>
      updateLineItem({
        lineId: item.id,
        quantity,
      }),
      false,
      "Cart quantity updated."
    )
  }

  const removeItem = () => {
    if (isPending || mutationInFlight.current) {
      return
    }

    mutate(() => deleteLineItem(item.id), true, "Item removed from cart.")
  }

  if (isRemoved) {
    return null
  }

  return (
    <article
      className={[
        "rounded-md border border-gray-100 bg-white p-3 shadow-[0_3px_12px_rgba(17,24,39,0.07)] transition-opacity",
        isPending ? "pointer-events-none opacity-60" : "",
      ].join(" ")}
      aria-busy={isPending}
    >
      <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className="block self-center"
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            size="square"
            className="!w-[72px] !rounded-md !bg-transparent !p-0 !shadow-none [&_img]:!object-contain"
          />
        </LocalizedClientLink>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <LocalizedClientLink
                href={`/products/${item.product_handle}`}
                className="block text-[13px] font-bold leading-[18px] text-[#111827] transition hover:text-brand"
                data-testid="side-cart-product-link"
              >
                {item.product_title}
              </LocalizedClientLink>
              {subtitle && (
                <p className="mt-0.5 text-[12px] leading-4 text-[#596070]">
                  {subtitle}
                </p>
              )}
            </div>
            <p className="shrink-0 whitespace-nowrap text-right text-[13px] font-bold text-brand">
              {money(item.total, currencyCode)}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#009c68]">
              <CheckCircleSolid className="h-4 w-4" />
              In Stock
            </span>

            <div className="flex items-center gap-2">
              <div className="inline-grid h-8 grid-cols-3 overflow-hidden rounded-md border border-gray-200 bg-white">
                <button
                  type="button"
                  onClick={() => changeQuantity(draftQuantity - 1)}
                  disabled={disabled || isPending || draftQuantity <= MIN_QUANTITY}
                  className="flex w-8 items-center justify-center text-[#4b5563] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                  aria-label={`Decrease quantity of ${item.product_title}`}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="flex w-8 items-center justify-center border-x border-gray-200 text-[13px] font-medium text-[#111827]">
                  {draftQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => changeQuantity(draftQuantity + 1)}
                  disabled={disabled || isPending || draftQuantity >= MAX_QUANTITY}
                  className="flex w-8 items-center justify-center text-[#4b5563] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                  aria-label={`Increase quantity of ${item.product_title}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={removeItem}
                disabled={disabled || isPending}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[#6b7280] transition hover:bg-gray-50 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Remove ${item.product_title} from cart`}
                data-testid="side-cart-remove-button"
              >
                {isPending ? <Spinner /> : <Trash className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-2 text-[12px] leading-4 text-red-600">{error}</p>
          )}
        </div>
      </div>
    </article>
  )
}

function FreeShippingStrip({
  cart,
  shippingOptions,
}: {
  cart: HttpTypes.StoreCart
  shippingOptions: StoreCartShippingOption[]
}) {
  const target = computeFreeShippingTarget(cart, shippingOptions)

  if (!target) {
    return null
  }

  return (
    <div className="mb-3 rounded-md bg-brand/10 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3 text-[11px] font-medium text-[#111827]">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-brand">
            <TruckFast className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            {target.targetReached ? (
              <span className="font-bold text-brand">FREE Delivery unlocked!</span>
            ) : (
              <>
                Add {money(target.targetRemaining, cart.currency_code)} more to
                enjoy <span className="font-bold text-brand">FREE Delivery!</span>
              </>
            )}
          </span>
        </div>
        <span className="shrink-0 font-semibold text-brand">
          {money(cart.item_total ?? 0, cart.currency_code)} /{" "}
          {money(target.targetAmount, cart.currency_code)}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand/15">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-300"
          style={{ width: `${target.progress}%` }}
        />
      </div>
    </div>
  )
}

function SideCartCouponForm({
  promotions,
  disabled,
  error,
  onApply,
  onRemove,
  isPending,
}: {
  promotions: CartPromotion[]
  disabled: boolean
  error: string | null
  onApply: (code: string) => void
  onRemove: (code: string) => void
  isPending: boolean
}) {
  const [code, setCode] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)
  const manualPromotionCodes = listManualPromotionCodes(promotions)
  const allPromotionCodes = listAllPromotionCodes(promotions)
  const automaticPromotions = hasAutomaticPromotions(promotions)
  const displayError = error ?? localError

  const submit = () => {
    setLocalError(null)
    const result = validatePromotionCode(code, allPromotionCodes)

    if (result.error) {
      setLocalError(result.error)
      return
    }

    if (manualPromotionCodes.length >= PROMOTION_CODE_MAX_COUNT) {
      setLocalError(`You can apply up to ${PROMOTION_CODE_MAX_COUNT} coupon codes.`)
      return
    }

    onApply(result.code)
    setCode("")
  }

  return (
    <div className="mb-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[13px] font-bold text-[#111827]">Coupon code</p>
        {automaticPromotions && (
          <span className="text-[11px] font-semibold text-emerald-700">
            Store offer applied
          </span>
        )}
      </div>
      <div className="flex h-11 overflow-hidden rounded-md border border-gray-200 bg-white shadow-[0_2px_8px_rgba(17,24,39,0.04)] focus-within:border-brand">
        <span className="flex w-10 shrink-0 items-center justify-center border-r border-gray-200 text-brand">
          <Tag className="h-5 w-5" />
        </span>
        <label htmlFor="side-cart-coupon" className="sr-only">
          Coupon code
        </label>
        <input
          id="side-cart-coupon"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              submit()
            }
          }}
          maxLength={PROMOTION_CODE_MAX_LENGTH}
          placeholder="Enter coupon code"
          className="min-w-0 flex-1 px-3 text-[13px] outline-none placeholder:text-[#8b90a0]"
          disabled={disabled}
          data-testid="side-cart-discount-input"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || isPending}
          className="m-1 rounded-md bg-brand px-3 text-[13px] font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="side-cart-discount-apply"
        >
          {isPending ? "Applying" : "Apply"}
        </button>
      </div>

      {(manualPromotionCodes.length > 0 || automaticPromotions) && (
        <div className="mt-2 flex flex-wrap gap-2" aria-label="Applied promotions">
          {manualPromotionCodes.map((promotionCode) => (
            <button
              key={promotionCode}
              type="button"
              onClick={() => onRemove(promotionCode)}
              disabled={disabled || isPending}
              className="inline-flex min-h-8 items-center gap-2 rounded-md border border-brand/25 bg-[#fff7f1] px-3 py-1.5 text-[12px] font-semibold text-[#333740] hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={`Remove coupon ${promotionCode}`}
            >
              {promotionCode}
              <Trash className="h-4 w-4" />
            </button>
          ))}
          {automaticPromotions && (
            <span
              className="inline-flex min-h-8 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700"
              title="Automatic offers are applied by the store when your cart is eligible."
            >
              Store discount applied
              <span className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-emerald-700">
                Auto
              </span>
            </span>
          )}
        </div>
      )}

      {displayError && (
        <p
          className="mt-2 text-[12px] leading-4 text-red-600"
          role="status"
          aria-live="polite"
        >
          {displayError}
        </p>
      )}
    </div>
  )
}

function SideCartSummary({
  cart,
  disabled,
  onClose,
}: {
  cart: HttpTypes.StoreCart
  disabled: boolean
  onClose: () => void
}) {
  const itemCount = getItemCount(cart)
  const hasAutomaticPromotions = Boolean(
    cart.promotions?.some((promotion) => promotion.is_automatic)
  )
  const checkoutHref = `/checkout?step=${getCheckoutStep(cart)}`
  const mapped = mapAuthoritativeTotals(cart, {
    itemCount,
    automaticPromotionApplied: hasAutomaticPromotions,
    compactMoney: true,
  })
  const subtotalRow = mapped.rows.find((row) => row.key === "subtotal")
  const discountRow = mapped.rows.find((row) => row.key === "discount")
  const taxRow = mapped.rows.find((row) => row.key === "tax")

  return (
    <div>
      <div className="flex flex-col gap-1.5 border-b border-gray-100 pb-3 text-[13px] text-[#333740]">
        <div className="flex items-center justify-between gap-4">
          <span>Subtotal ({itemCount} items)</span>
          <span className="font-medium">
            {subtotalRow?.display ?? money(cart.item_subtotal ?? cart.subtotal, cart.currency_code)}
          </span>
        </div>
        {discountRow && (
          <div className="flex items-center justify-between gap-4 text-emerald-700">
            <span>
              {hasAutomaticPromotions ? "Store discount" : "Coupon discount"}
            </span>
            <span className="font-semibold">
              -{discountRow.display}
            </span>
          </div>
        )}
        {mapped.shippingVisible && (
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5">
              Delivery Fee
              <InformationCircle className="h-4 w-4 text-[#8b90a0]" />
            </span>
            <span className="text-right">
              {mapped.shippingBeforeDiscountDisplay && (
                <span className="block text-[12px] font-medium text-[#8b90a0] line-through">
                  {mapped.shippingBeforeDiscountDisplay}
                </span>
              )}
              <span
                className={`font-medium ${
                  mapped.shippingIsFree || mapped.hasDiscount
                    ? "text-emerald-700"
                    : ""
                }`}
              >
                {mapped.shippingDisplay}
              </span>
            </span>
          </div>
        )}
        {taxRow && (
          <div className="flex items-center justify-between gap-4">
            <span>{taxRow.label}</span>
            <span className="font-medium">{taxRow.display}</span>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-4 py-3">
        <span className="text-[17px] font-bold text-[#111827]">Total</span>
        <span className="text-right">
          <span className="block text-[20px] font-bold text-brand">
            {mapped.total.display}
          </span>
          {mapped.taxNote && (
            <span className="mt-0.5 block text-[11px] text-[#596070]" aria-live="polite">
              {mapped.taxNote}
            </span>
          )}
        </span>
      </div>

      {disabled ? (
        <button
          type="button"
          disabled
          className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-md bg-brand px-5 text-[15px] font-bold text-white opacity-60"
          data-testid="side-cart-checkout"
        >
          <LockClosedSolid className="h-5 w-5" />
          Proceed to Checkout
          <ArrowRight className="h-5 w-5" />
        </button>
      ) : (
        <LocalizedClientLink
          href={checkoutHref}
          onClick={onClose}
          className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-md bg-brand px-5 text-[15px] font-bold text-white transition hover:bg-brand-hover"
          data-testid="side-cart-checkout"
        >
          <LockClosedSolid className="h-5 w-5" />
          Proceed to Checkout
          <ArrowRight className="h-5 w-5" />
        </LocalizedClientLink>
      )}

      <LocalizedClientLink
        href="/cart"
        onClick={onClose}
        className="mt-2.5 inline-flex h-10 w-full items-center justify-center gap-3 rounded-md border border-brand bg-white px-5 text-[15px] font-bold text-brand transition hover:bg-brand/5"
        data-testid="side-cart-view-cart"
      >
        <ShoppingCartIcon size={20} strokeWidth={1.8} />
        View Cart
      </LocalizedClientLink>
    </div>
  )
}
