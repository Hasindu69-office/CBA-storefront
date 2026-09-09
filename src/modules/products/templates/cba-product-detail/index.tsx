"use client"

import { addToCart } from "@lib/data/cart"
import { requestBackInStock } from "@lib/data/back-in-stock"
import {
  listInstallmentPlans,
  type StoreInstallmentPlan,
} from "@lib/data/installments"
import type { FeaturedProductCard } from "@lib/data/featured-products"
import type { KokoCheckoutBranding } from "@lib/data/koko-branding"
import type { PdpBannerContent } from "@lib/data/pdp-banners"
import type {
  ProductDetailResponse,
  ProductReviewsResponse,
} from "@lib/data/product-detail"
import { notify } from "@lib/notifications"
import { getProductPrice } from "@lib/util/get-product-price"
import { hasPurchasablePrice, variantOptionsMap, visibleProductOptions } from "@lib/util/product-options"
import { kokoInstallmentCardLabelFromAmount } from "@lib/util/koko-installments"
import { convertToLocale } from "@lib/util/money"
import { normalizeEmail, validateEmail } from "@lib/util/storefront-form-validation"
import { openSideCart } from "@lib/util/side-cart-event"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import KokoInstallmentLine from "@modules/common/components/koko-installment-line"
import ProductCompanionZone from "@modules/products/components/product-companion-zone"
import PdpSidebarBanners from "@modules/products/components/pdp-sidebar-banners"
import RelatedProductsSection from "@modules/products/components/related-products-section"
import {
  ShoppingCartIcon,
} from "@modules/layout/components/cba-icons"
import {
  useWishlistProduct,
  WishlistProductButton,
} from "@modules/wishlist/components/wishlist-product-button"
import { isEqual } from "lodash"
import Image from "next/image"
import {
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react"

type CbaProductDetailProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
  images: HttpTypes.StoreProductImage[]
  detail: ProductDetailResponse | null
  reviews: ProductReviewsResponse
  crossSellProducts: FeaturedProductCard[]
  accessoryProducts: FeaturedProductCard[]
  upSellProducts: FeaturedProductCard[]
  relatedProducts: FeaturedProductCard[]
  pdpBanners: PdpBannerContent
  kokoBranding?: KokoCheckoutBranding | null
  kokoAvailable?: boolean
  selectedVariantId?: string
}

type ActionState = {
  type: "success" | "error" | null
  message: string
}

function optionsAsKeymap(
  variantOptions: HttpTypes.StoreProductVariant["options"]
) {
  return variantOptionsMap(variantOptions)
}

function initialOptions(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
) {
  const selectedVariant = selectedVariantId
    ? product.variants?.find((variant) => variant.id === selectedVariantId)
    : undefined

  if (selectedVariant) {
    return optionsAsKeymap(selectedVariant.options) ?? {}
  }

  const firstPurchasable =
    product.variants?.find((variant) => variant.manage_inventory === false) ??
    product.variants?.find(
      (variant) =>
        variant.allow_backorder ||
        !variant.manage_inventory ||
        (variant.inventory_quantity ?? 0) > 0
    ) ??
    product.variants?.[0]

  return firstPurchasable ? optionsAsKeymap(firstPurchasable.options) ?? {} : {}
}

export default function CbaProductDetail({
  product,
  countryCode,
  images,
  detail,
  reviews,
  crossSellProducts,
  accessoryProducts,
  upSellProducts,
  relatedProducts,
  pdpBanners,
  kokoBranding,
  kokoAvailable = false,
  selectedVariantId,
}: CbaProductDetailProps) {
  const galleryImages = images.length ? images : product.thumbnail
    ? [{ id: "thumbnail", url: product.thumbnail } as HttpTypes.StoreProductImage]
    : []
  const [activeImage, setActiveImage] = useState(galleryImages[0]?.url ?? "")
  const [options, setOptions] = useState<Record<string, string | undefined>>(
    initialOptions(product, selectedVariantId)
  )
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState("description")
  const [actionState, setActionState] = useState<ActionState>({
    type: null,
    message: "",
  })
  const [waitlistEmail, setWaitlistEmail] = useState("")
  const [waitlistConsent, setWaitlistConsent] = useState(false)
  const [waitlistState, setWaitlistState] = useState<ActionState>({
    type: null,
    message: "",
  })
  const [installmentPlans, setInstallmentPlans] = useState<StoreInstallmentPlan[]>([])
  const [isPending, startTransition] = useTransition()
  const { isWishlisted } = useWishlistProduct(product.id)

  const selectedVariant = useMemo(() => {
    if (!product.variants?.length) return undefined
    return product.variants.find((variant) =>
      isEqual(optionsAsKeymap(variant.options), options)
    )
  }, [product.variants, options])

  const isValidVariant = useMemo(() => {
    return Boolean(
      product.variants?.some((variant) =>
        isEqual(optionsAsKeymap(variant.options), options)
      )
    )
  }, [product.variants, options])

  const displayOptions = visibleProductOptions(product.options)
  const hasPrice = hasPurchasablePrice(selectedVariant)

  useEffect(() => {
    setOptions(initialOptions(product, selectedVariantId))
    setQuantity(1)
  }, [product, selectedVariantId])

  const inStock = useMemo(() => {
    if (selectedVariant && !selectedVariant.manage_inventory) return true
    if (selectedVariant?.allow_backorder) return true
    return Boolean(
      selectedVariant?.manage_inventory &&
        (selectedVariant.inventory_quantity ?? 0) > 0
    )
  }, [selectedVariant])

  const selectedPrice = getProductPrice({
    product,
    variantId: selectedVariant?.id,
  })
  const price = selectedVariant
    ? selectedPrice.variantPrice
    : selectedPrice.cheapestPrice
  const hasDiscount = Boolean(
    price && price.original_price_number > price.calculated_price_number
  )
  const kokoInstallment =
    kokoAvailable && inStock && isValidVariant
      ? kokoInstallmentCardLabelFromAmount(
          price?.calculated_price_number,
          price?.currency_code
        )
      : null
  const reviewCount = detail?.review_summary?.total_reviews ?? 0
  const rating = detail?.review_summary?.average_rating ?? null
  const mainProductImage = activeImage || product.thumbnail || galleryImages[0]?.url || null
  const hasPdpSidebarBanners = Boolean(pdpBanners.primary || pdpBanners.secondary)
  const hasCompanionContent =
    crossSellProducts.length > 0 ||
    accessoryProducts.length > 0 ||
    upSellProducts.length > 0
  const bundleSectionProps = {
    product,
    countryCode,
    mainImage: mainProductImage,
    mainPrice: price?.calculated_price_number ?? null,
    currencyCode: price?.currency_code ?? "lkr",
    mainVariantId: selectedVariant?.id,
    mainPurchasable: inStock && isValidVariant && hasPrice,
    mainValid: isValidVariant,
    quantity,
    onActionMessage: setActionState,
  }
  const shortDescription =
    detail?.catalog_profile?.short_description ?? product.description ?? ""
  const bulletSpecs =
    detail?.specification_groups
      .flatMap((group) => group.specifications)
      .slice(0, 3) ?? []
  const installmentAmount = price?.calculated_price_number ?? null
  const installmentEligible = Boolean(detail?.catalog_profile?.installment_eligible)

  useEffect(() => {
    let alive = true
    if (!installmentEligible || !installmentAmount) {
      setInstallmentPlans([])
      return
    }

    listInstallmentPlans({ amount: installmentAmount })
      .then((result) => {
        if (alive) {
          setInstallmentPlans(result.installment_plans)
        }
      })
      .catch(() => {
        if (alive) {
          setInstallmentPlans([])
        }
      })

    return () => {
      alive = false
    }
  }, [installmentAmount, installmentEligible])

  function setOptionValue(optionId: string, value: string) {
    setOptions((current) => ({ ...current, [optionId]: value }))
  }

  function clampQuantity(value: number) {
    setQuantity(Math.min(99, Math.max(1, Number.isFinite(value) ? Math.trunc(value) : 1)))
  }

  function submitAddToCart() {
    if (!hasPrice || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      notify.error(!hasPrice ? "Price unavailable for this product." : "Enter a quantity from 1 to 99.")
      return
    }
    if (!selectedVariant?.id || !isValidVariant) {
      notify.error("Select a valid product option.")
      setActionState({ type: "error", message: "Select a valid product option." })
      return
    }
    if (!inStock) {
      notify.error("This selection is out of stock.")
      setActionState({ type: "error", message: "This selection is out of stock." })
      return
    }

    openSideCart({ pendingMessage: "Adding item to cart.", refresh: false })
    startTransition(async () => {
      const toastId = `pdp-add-to-cart:${selectedVariant.id}`
      notify.loading("Adding item to cart...", { id: toastId })
      try {
        const cart = await addToCart({
          variantId: selectedVariant.id,
          quantity,
          countryCode,
        })
        setActionState({ type: "success", message: "Added to cart." })
        openSideCart({ cart, refresh: true })
        notify.success("Item added to cart.", { id: toastId })
      } catch (error) {
        openSideCart({ pendingMessage: null, refresh: false })
        notify.error(error, "Could not add this item to your cart.", {
          id: toastId,
        })
        setActionState({
          type: "error",
          message: error instanceof Error ? error.message : "Could not add to cart.",
        })
      }
    })
  }

  function submitBackInStock() {
    const email = normalizeEmail(waitlistEmail)
    const emailError = validateEmail(email)

    if (!selectedVariant?.id || !isValidVariant) {
      notify.error("Select the option you want.")
      setWaitlistState({ type: "error", message: "Select the option you want." })
      return
    }
    if (emailError) {
      setWaitlistState({ type: "error", message: emailError })
      return
    }
    if (!waitlistConsent) {
      notify.error("Confirm that we can email you about this item.")
      setWaitlistState({ type: "error", message: "Confirm that we can email you about this item." })
      return
    }

    const formData = new FormData()
    formData.set("email", email)
    formData.set("product_id", product.id)
    formData.set("variant_id", selectedVariant.id)
    formData.set("consent", "on")

    startTransition(async () => {
      const toastId = `back-in-stock:${selectedVariant.id}`
      notify.loading("Submitting availability request...", { id: toastId })
      const result = await requestBackInStock(null, formData)
      setWaitlistState({
        type: result.status === "success" ? "success" : "error",
        message: result.message,
      })
      if (result.status === "success") {
        setWaitlistEmail("")
        setWaitlistConsent(false)
        notify.success(result.message, { id: toastId })
      } else {
        notify.error(result.message, "Could not submit availability request.", {
          id: toastId,
        })
      }
    })
  }

  return (
    <main className="overflow-x-clip bg-white text-[#191919]">
      <div className="content-container min-w-0 py-6 small:py-8">
        <Breadcrumbs product={product} />

        <section className="grid min-w-0 gap-6 pt-6 small:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_310px] small:gap-8 small:pt-7">
          <ProductGallery
            title={product.title}
            images={galleryImages}
            activeImage={activeImage}
            setActiveImage={setActiveImage}
          />

          <div className="min-w-0">

            <div className="flex items-center gap-2 text-xs">
              <Stars rating={rating ?? 0} />
              <span className="font-semibold">
                {rating ? rating.toFixed(1) : "No"} Rating
              </span>
              <span className="text-gray-500">
                ({reviewCount.toLocaleString()} user feedback)
              </span>
            </div>
            <h1 className="mt-2 max-w-xl text-2xl font-bold leading-tight small:text-[28px]">
              {product.title}
            </h1>
            {price && (
              <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span
                  className={
                    hasDiscount
                      ? "text-2xl font-bold text-[#c62828]"
                      : "text-2xl font-bold"
                  }
                  data-testid="pdp-calculated-price"
                >
                  {price.calculated_price}
                </span>
                {hasDiscount && (
                  <>
                    <span
                      className="text-sm text-gray-500 line-through"
                      data-testid="pdp-original-price"
                    >
                      {price.original_price}
                    </span>
                    <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold uppercase text-[#c62828]">
                      Save {price.percentage_diff}%
                    </span>
                  </>
                )}
              </div>
            )}
            {kokoInstallment && (
              <KokoInstallmentLine
                installment={kokoInstallment}
                branding={kokoBranding}
                className="mt-2"
              />
            )}
            <ul className="mt-4 space-y-1.5 text-sm text-gray-700">
              {shortDescription && (
                <li className="text-justify leading-6">{shortDescription}</li>
              )}
              {bulletSpecs.map((spec) => (
                <li key={spec.definition_id}>
                  {spec.definition?.name ? `${spec.definition.name}: ` : ""}
                  {formatSpecValue(spec.value)}
                </li>
              ))}
              {detail?.catalog_profile?.delivery_summary && (
                <li>{detail.catalog_profile.delivery_summary}</li>
              )}
            </ul>

            <div
              className={`mt-5 flex flex-wrap gap-2 pb-5 ${
                displayOptions.length > 0 ? "border-b border-gray-200" : ""
              }`}
            >
              {detail?.badges.map((badge) => (
                <span
                  key={`promo-${badge.code}`}
                  className="rounded-base bg-green-50 px-3 py-2 text-xs font-bold uppercase text-green-700"
                >
                  {badge.label}
                </span>
              ))}
            </div>

            {displayOptions.length > 0 && <div className="mt-5 space-y-5">
              {displayOptions.map((option) => (
                <ProductOptionGroup
                  key={option.id}
                  option={option}
                  current={options[option.id]}
                  updateOption={setOptionValue}
                  disabled={isPending}
                />
              ))}
            </div>}

            <ProductMeta
              product={product}
              selectedVariant={selectedVariant}
              brandName={detail?.brand?.name}
            />
          </div>

          <aside className="h-fit min-w-0 rounded-rounded bg-[#f3f5fb] p-5 small:p-6">
            <p className="text-xs font-bold uppercase text-gray-500">Total Price</p>
            {price ? (
              <div className="mt-2">
                {hasDiscount && (
                  <p
                    className="text-sm text-gray-500 line-through"
                    data-testid="pdp-sidebar-original-price"
                  >
                    {price.original_price}
                  </p>
                )}
                <p
                  className={
                    hasDiscount
                      ? "text-[30px] font-black leading-tight text-[#c62828]"
                      : "text-[30px] font-black leading-tight"
                  }
                  data-testid="pdp-sidebar-calculated-price"
                >
                  {price.calculated_price}
                </p>
                {hasDiscount && (
                  <span className="mt-2 inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold uppercase text-[#c62828]">
                    Save {price.percentage_diff}%
                  </span>
                )}
              </div>
            ) : (
              <p className="mt-2 text-[30px] font-black leading-tight">
                Price unavailable
              </p>
            )}
            {kokoInstallment && (
              <div className="mt-3 rounded-base border border-[#eadfff] bg-white px-3 py-3">
                <KokoInstallmentLine
                  installment={kokoInstallment}
                  branding={kokoBranding}
                  className="text-[12px] leading-5"
                />
              </div>
            )}
            <PdpInstallmentPreview
              plans={installmentPlans}
              currencyCode={price?.currency_code ?? "lkr"}
              eligible={installmentEligible}
            />
            <div className="mt-5 flex items-center gap-2 text-sm">
              <span
                className={
                  inStock
                    ? "h-2 w-2 rounded-circle bg-green-500"
                    : "h-2 w-2 rounded-circle bg-red-500"
                }
              />
              <span>{inStock ? "In stock" : "Out of stock"}</span>
            </div>
            <div className="mt-4 grid w-full grid-cols-[44px_1fr_44px] overflow-hidden rounded-base border border-gray-200 bg-white">
              <button
                type="button"
                className="h-11 text-xl font-bold"
                onClick={() => clampQuantity(quantity - 1)}
                disabled={isPending}
                aria-label="Decrease quantity"
              >
                -
              </button>
              <input
                value={quantity}
                onChange={(event) => clampQuantity(Number(event.target.value))}
                className="h-11 w-full border-x border-gray-200 text-center text-sm font-bold outline-none"
                inputMode="numeric"
                aria-label="Quantity"
              />
              <button
                type="button"
                className="h-11 text-xl font-bold"
                onClick={() => clampQuantity(quantity + 1)}
                disabled={isPending}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={submitAddToCart}
              disabled={!selectedVariant || !isValidVariant || !inStock || !hasPrice || isPending}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-base border border-brand bg-white text-xs font-bold uppercase text-brand transition hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCartIcon size={16} />
              Add to cart
            </button>
            {!inStock && selectedVariant?.id && isValidVariant && (
              <div className="mt-4 rounded-base border border-gray-200 bg-white p-4">
                <p className="text-xs font-black uppercase text-gray-700">
                  Notify me when available
                </p>
                <div className="mt-3 space-y-3">
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={(event) => {
                      setWaitlistEmail(event.target.value)
                      const emailError = validateEmail(normalizeEmail(event.target.value))
                      setWaitlistState(
                        emailError
                          ? { type: "error", message: emailError }
                          : { type: null, message: "" }
                      )
                    }}
                    placeholder="Email address"
                    aria-invalid={waitlistState.type === "error" || undefined}
                    aria-describedby={
                      waitlistState.type === "error"
                        ? "back-in-stock-email-error"
                        : undefined
                    }
                    className={`h-11 w-full rounded-base border px-3 text-sm outline-none focus:border-brand ${
                      waitlistState.type === "error"
                        ? "border-rose-300 bg-rose-50/40"
                        : "border-gray-200"
                    }`}
                    autoComplete="email"
                    disabled={isPending}
                  />
                  <label className="flex gap-2 text-xs leading-5 text-gray-600">
                    <input
                      type="checkbox"
                      checked={waitlistConsent}
                      onChange={(event) => setWaitlistConsent(event.target.checked)}
                      className="mt-1"
                      disabled={isPending}
                    />
                    Email me once for this item when it is available.
                  </label>
                  <button
                    type="button"
                    onClick={submitBackInStock}
                    disabled={isPending}
                    className="h-10 w-full rounded-base bg-brand text-xs font-bold uppercase text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Notify me
                  </button>
                  {waitlistState.message && (
                    <p
                      id={
                        waitlistState.type === "error"
                          ? "back-in-stock-email-error"
                          : undefined
                      }
                      className={
                        waitlistState.type === "success"
                          ? "text-xs text-green-700"
                          : "text-xs text-red-600"
                      }
                    >
                      {waitlistState.message}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="mt-5 flex items-center justify-between text-xs text-gray-600">
              <WishlistProductButton
                productId={product.id}
                variantId={selectedVariant?.id}
                productTitle={product.title}
                toastId={`pdp-wishlist:${product.id}`}
                variant="pdp"
                disabled={isPending || !isValidVariant}
                iconClassName="text-green-600"
                className="flex items-center gap-2 hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
                onResult={(result) =>
                  setActionState({
                    type: result.success ? "success" : "error",
                    message: result.message,
                  })
                }
              >
                {isWishlisted ? "Wishlist added" : "Wishlist"}
              </WishlistProductButton>
              <span className="text-gray-300">|</span>
              <LocalizedClientLink
                href="/compare"
                className="flex items-center gap-2 hover:text-brand"
              >
                <ScaleIcon size={15} className="text-gray-500" />
                Compare
              </LocalizedClientLink>
            </div>
            {detail?.warranty?.summary && (
              <p className="mt-5 border-t border-gray-200 pt-4 text-xs text-gray-600">
                {detail.warranty.summary}
              </p>
            )}
            <Image
              src="/images/paymentmethods.png"
              alt="Accepted payment methods"
              width={220}
              height={32}
              className="mt-4 h-auto w-full max-w-[190px]"
            />
            {actionState.message && (
              <p
                className={
                  actionState.type === "success"
                    ? "mt-4 text-sm text-green-700"
                    : "mt-4 text-sm text-red-600"
                }
              >
                {actionState.message}
              </p>
            )}
          </aside>
        </section>

        {(hasCompanionContent || hasPdpSidebarBanners) && (
          <section
            className={
              hasCompanionContent && hasPdpSidebarBanners
                ? "mt-12 grid min-w-0 gap-4 small:grid-cols-[minmax(0,1fr)_280px]"
                : "mt-12"
            }
          >
            {hasCompanionContent && (
              <ProductCompanionZone
                {...bundleSectionProps}
                crossSellProducts={crossSellProducts}
                accessoryProducts={accessoryProducts}
                upSellProducts={upSellProducts}
              />
            )}
            {hasPdpSidebarBanners && (
              <div className={hasCompanionContent ? "h-full min-h-0" : undefined}>
                <PdpSidebarBanners
                  banners={pdpBanners}
                  layout={hasCompanionContent ? "sidebar" : "standalone"}
                />
              </div>
            )}
          </section>
        )}

        <ProductTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          product={product}
          detail={detail}
          reviews={reviews}
        />

        <RelatedProductsSection
          products={relatedProducts}
          kokoBranding={kokoBranding}
          kokoAvailable={kokoAvailable}
        />
      </div>
    </main>
  )
}

function PdpInstallmentPreview({
  plans,
  currencyCode,
  eligible,
}: {
  plans: StoreInstallmentPlan[]
  currencyCode: string
  eligible: boolean
}) {
  const bankGroups = useMemo(() => groupInstallmentPlansByBank(plans), [plans])
  const [openBankCode, setOpenBankCode] = useState<string | null>("__first__")

  useEffect(() => {
    if (!bankGroups.length) {
      setOpenBankCode(null)
      return
    }
    if (
      openBankCode === "__first__" ||
      (openBankCode && !bankGroups.some((group) => group.bankCode === openBankCode))
    ) {
      setOpenBankCode(bankGroups[0].bankCode)
    }
  }, [bankGroups, openBankCode])

  if (!eligible || !bankGroups.length) {
    return null
  }

  return (
    <div
      className="mt-4 rounded-base border border-gray-200 bg-white p-3"
      aria-label="Installment plans"
    >
      <div className="flex min-h-8 items-center justify-between gap-2">
        <p className="text-xs font-black uppercase text-gray-700">
          Installment Plans
        </p>
      </div>

      <div className="mt-2 divide-y divide-gray-100">
        {bankGroups.map((group) => {
          const panelId = `pdp-installments-${safeDomId(group.bankCode)}`
          const isOpen = openBankCode === group.bankCode

          return (
            <div key={group.bankCode} className="py-1 first:pt-0 last:pb-0">
              <button
                type="button"
                className="grid w-full grid-cols-[minmax(0,1fr)_72px_18px] items-center gap-2 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() =>
                  setOpenBankCode((current) =>
                    current === group.bankCode ? null : group.bankCode
                  )
                }
              >
                <span className="min-w-0">
                  <span className="block text-xs font-bold leading-5 text-gray-800">
                    Up to {group.maxTenorMonths} months from{" "}
                    {group.lowestMonthlyAmount !== null
                      ? formatInstallmentMoney(group.lowestMonthlyAmount, currencyCode)
                      : "available"}
                    /month
                  </span>
                  <span className="block break-words text-[11px] font-medium leading-4 text-gray-500">
                    {group.bankName}
                  </span>
                </span>
                <BankLogo group={group} />
                <ChevronDownIcon
                  className={
                    isOpen
                      ? "h-4 w-4 rotate-180 justify-self-end text-gray-500 transition"
                      : "h-4 w-4 justify-self-end text-gray-500 transition"
                  }
                />
              </button>

              <div
                id={panelId}
                className={
                  isOpen
                    ? "grid grid-rows-[1fr] opacity-100 transition-all duration-300 ease-out motion-reduce:transition-none"
                    : "grid grid-rows-[0fr] opacity-0 transition-all duration-300 ease-out motion-reduce:transition-none"
                }
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="pb-2 pl-1 pr-1">
                    <div className="rounded-base bg-gray-50 px-2 py-1">
                      {group.plans.map((plan) => (
                        <InstallmentPlanPreviewRow
                          key={plan.id}
                          plan={plan}
                          currencyCode={currencyCode}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type InstallmentBankGroup = {
  bankCode: string
  bankName: string
  logoPath: string | null
  maxTenorMonths: number
  lowestMonthlyAmount: number | null
  plans: StoreInstallmentPlan[]
}

function groupInstallmentPlansByBank(
  plans: StoreInstallmentPlan[]
): InstallmentBankGroup[] {
  const grouped = new Map<string, StoreInstallmentPlan[]>()

  for (const plan of plans) {
    const bankCode = plan.bank_code || plan.bank_name
    grouped.set(bankCode, [...(grouped.get(bankCode) ?? []), plan])
  }

  return Array.from(grouped.entries()).map(([bankCode, bankPlans]) => {
    const sortedPlans = [...bankPlans].sort(
      (left, right) => left.tenor_months - right.tenor_months
    )
    const monthlyAmounts = sortedPlans
      .map((plan) => plan.monthly_amount)
      .filter((amount): amount is number => Number.isFinite(amount))

    return {
      bankCode,
      bankName: sortedPlans[0]?.bank_name ?? bankCode.toUpperCase(),
      logoPath: sortedPlans.find((plan) => plan.logo_path)?.logo_path ?? null,
      maxTenorMonths: Math.max(
        ...sortedPlans.map((plan) => Number(plan.tenor_months) || 0)
      ),
      lowestMonthlyAmount: monthlyAmounts.length
        ? Math.min(...monthlyAmounts)
        : null,
      plans: sortedPlans,
    }
  })
}

function safeDomId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "")
}

function formatInstallmentMoney(amount: number, currencyCode: string) {
  return convertToLocale({
    amount,
    currency_code: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function InstallmentPlanPreviewRow({
  plan,
  currencyCode,
}: {
  plan: StoreInstallmentPlan
  currencyCode: string
}) {
  return (
    <div className="grid min-h-[38px] grid-cols-[1fr_auto] items-center gap-2 border-b border-gray-200 py-2 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-gray-700">
          {plan.tenor_months} x{" "}
          {plan.monthly_amount !== undefined
            ? formatInstallmentMoney(plan.monthly_amount, currencyCode)
            : "Available"}
        </p>
      </div>
      <span className="justify-self-end whitespace-nowrap text-[11px] font-semibold text-gray-500">
        Rate {formatInstallmentRate(plan.fee_percentage)}
      </span>
    </div>
  )
}

function BankLogo({ group }: { group: InstallmentBankGroup }) {
  if (group.logoPath) {
    return (
      <span className="relative h-8 w-[72px] justify-self-end rounded bg-white">
        <Image
          src={group.logoPath}
          alt={group.bankName}
          fill
          sizes="72px"
          className="object-contain"
        />
      </span>
    )
  }

  return (
    <span className="justify-self-end truncate text-[11px] font-bold text-gray-500">
      {group.bankCode.toUpperCase()}
    </span>
  )
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function Breadcrumbs({ product }: { product: HttpTypes.StoreProduct }) {
  const category = product.categories?.[0]

  return (
    <nav className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 rounded-rounded border border-gray-100 px-4 py-4 text-xs font-semibold text-gray-400 small:px-6 small:py-5">
      <LocalizedClientLink href="/" className="shrink-0 hover:text-brand">
        Home
      </LocalizedClientLink>
      <span className="shrink-0">/</span>
      <LocalizedClientLink href="/store" className="shrink-0 hover:text-brand">
        Shop
      </LocalizedClientLink>
      {category?.handle && (
        <>
          <span className="shrink-0">/</span>
          <LocalizedClientLink
            href={`/categories/${category.handle}`}
            className="min-w-0 break-words hover:text-brand"
          >
            {category.name}
          </LocalizedClientLink>
        </>
      )}
      <span className="shrink-0">/</span>
      <span className="min-w-0 break-words text-gray-900">{product.title}</span>
    </nav>
  )
}

function ProductGallery({
  title,
  images,
  activeImage,
  setActiveImage,
}: {
  title: string
  images: HttpTypes.StoreProductImage[]
  activeImage: string
  setActiveImage: (value: string) => void
}) {
  return (
    <div className="min-w-0">
      <div className="relative aspect-[4/3] overflow-hidden rounded-rounded bg-gray-50">
        {activeImage ? (
          <Image
            src={activeImage}
            alt={title}
            fill
            priority
            sizes="(max-width: 1024px) 92vw, 520px"
            className="object-contain p-5 xsmall:p-8"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No image
          </div>
        )}
      </div>
      <div className="no-scrollbar mt-4 flex max-w-full gap-3 overflow-x-auto overscroll-x-contain pb-1 small:mt-5 small:gap-4">
        {images.slice(0, 5).map((image, index) => (
          <button
            type="button"
            key={image.id ?? image.url ?? index}
            onClick={() => image.url && setActiveImage(image.url)}
            className={
              image.url === activeImage
                ? "relative h-16 w-16 shrink-0 rounded-base border-2 border-brand bg-white xsmall:h-20 xsmall:w-20"
                : "relative h-16 w-16 shrink-0 rounded-base border border-gray-200 bg-white xsmall:h-20 xsmall:w-20"
            }
            aria-label={`View image ${index + 1}`}
          >
            {image.url && (
              <Image
                src={image.url}
                alt={`${title} thumbnail ${index + 1}`}
                fill
                sizes="80px"
                className="object-contain p-2"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function ProductOptionGroup({
  option,
  current,
  updateOption,
  disabled,
}: {
  option: HttpTypes.StoreProductOption
  current?: string
  updateOption: (optionId: string, value: string) => void
  disabled: boolean
}) {
  const values = (option.values ?? []).map((value) => value.value)
  const isColor = /colou?r/i.test(option.title ?? "")

  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase">
        {option.title}:{" "}
        {current && <span className="font-medium normal-case text-gray-500">{current}</span>}
      </p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <button
            type="button"
            key={value}
            onClick={() => updateOption(option.id, value)}
            disabled={disabled}
            className={
              value === current
                ? "min-h-11 rounded-base border border-green-500 bg-green-50 px-4 text-xs font-bold"
                : "min-h-11 rounded-base border border-gray-200 bg-white px-4 text-xs font-bold hover:border-brand"
            }
          >
            {isColor && (
              <span
                className="mr-2 inline-block h-4 w-4 rounded-circle align-middle ring-1 ring-gray-200"
                style={{ backgroundColor: colorValue(value) }}
              />
            )}
            {value}
          </button>
        ))}
      </div>
    </div>
  )
}

function ProductMeta({
  product,
  selectedVariant,
  brandName,
}: {
  product: HttpTypes.StoreProduct
  selectedVariant?: HttpTypes.StoreProductVariant
  brandName?: string
}) {
  const sku =
    selectedVariant?.sku ?? product.variants?.find((variant) => variant.sku)?.sku
  const category = product.categories?.[0]?.name

  return (
    <div className="mt-7 border-t border-gray-200 pt-5 text-xs uppercase leading-6">
      {sku && (
        <p>
          <span className="font-black">SKU:</span>{" "}
          <span className="text-gray-500">{sku}</span>
        </p>
      )}
      {category && (
        <p>
          <span className="font-black">Category:</span>{" "}
          <span className="text-gray-500">{category}</span>
        </p>
      )}
      {brandName && (
        <p>
          <span className="font-black">Brand:</span>{" "}
          <span className="text-green-600">{brandName}</span>
        </p>
      )}
    </div>
  )
}

function ProductTabs({
  activeTab,
  setActiveTab,
  product,
  detail,
  reviews,
}: {
  activeTab: string
  setActiveTab: (value: string) => void
  product: HttpTypes.StoreProduct
  detail: ProductDetailResponse | null
  reviews: ProductReviewsResponse
}) {
  const tabs = [
    { key: "description", label: "Description" },
    { key: "specifications", label: "Specifications" },
    { key: "additional", label: "Additional Information" },
    { key: "reviews", label: `Reviews (${detail?.review_summary?.total_reviews ?? 0})` },
  ]

  return (
    <section className="mt-12">
      <div className="no-scrollbar flex max-w-full gap-6 overflow-x-auto overscroll-x-contain border-b border-gray-200 small:gap-8">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={
              activeTab === tab.key
                ? "shrink-0 border-b-2 border-brand py-4 text-sm font-black uppercase text-black"
                : "shrink-0 py-4 text-sm font-bold uppercase text-gray-400 hover:text-black"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="py-8">
        {activeTab === "description" && (
          <DescriptionContent product={product} detail={detail} />
        )}
        {activeTab === "specifications" && <SpecificationsContent detail={detail} />}
        {activeTab === "additional" && <AdditionalContent detail={detail} />}
        {activeTab === "reviews" && <ReviewsContent detail={detail} reviews={reviews} />}
      </div>
    </section>
  )
}

function DescriptionContent({
  product,
  detail,
}: {
  product: HttpTypes.StoreProduct
  detail: ProductDetailResponse | null
}) {
  const richDescription = findRichDescription(detail)

  if (!richDescription?.body_html) {
    return (
      <p className="max-w-5xl text-justify text-sm leading-7 text-gray-700">
        {product.description || "Product description is not available."}
      </p>
    )
  }

  return (
    <div
      className="pdp-rich-description max-w-5xl text-sm leading-7 text-gray-700 [&_a]:font-semibold [&_a]:text-brand [&_blockquote]:border-l-4 [&_blockquote]:border-brand [&_blockquote]:pl-4 [&_blockquote]:text-gray-600 [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:leading-tight [&_h2]:text-gray-950 [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-black [&_h3]:text-gray-950 [&_h4]:mb-2 [&_h4]:mt-5 [&_h4]:text-base [&_h4]:font-black [&_h4]:text-gray-950 [&_hr]:my-8 [&_img]:my-6 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-rounded [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_strong]:font-black [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
      dangerouslySetInnerHTML={{ __html: richDescription.body_html }}
    />
  )
}

function findRichDescription(detail: ProductDetailResponse | null) {
  if (!detail?.detail_sections.length) {
    return null
  }

  return (
    detail.detail_sections.find(
      (section) =>
        section.type === "description" &&
        section.layout === "text" &&
        section.sort_order === 0 &&
        Boolean(section.body_html)
    ) ??
    detail.detail_sections.find(
      (section) =>
        section.type === "description" &&
        section.layout === "text" &&
        Boolean(section.body_html)
    ) ??
    null
  )
}

function ReviewsContent({
  detail,
  reviews,
}: {
  detail: ProductDetailResponse | null
  reviews: ProductReviewsResponse
}) {
  const summary = detail?.review_summary ?? reviews.summary
  const items = reviews.reviews ?? []

  return (
    <div className="grid gap-5 small:grid-cols-[280px_1fr]">
      <div className="h-fit rounded-rounded bg-gray-50 p-6">
        <p className="text-2xl font-black">
          {summary?.average_rating ? summary.average_rating.toFixed(1) : "No ratings yet"}
        </p>
        <p className="mt-1 text-sm text-gray-600">
          {(summary?.total_reviews ?? 0).toLocaleString()} approved customer reviews
        </p>
        <div className="mt-5 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="grid grid-cols-[32px_1fr_36px] items-center gap-2 text-xs">
              <span>{rating} star</span>
              <span className="h-2 overflow-hidden rounded-circle bg-gray-200">
                <span
                  className="block h-full bg-brand"
                  style={{
                    width: reviewPercentage(
                      summary?.rating_counts?.[String(rating)] ?? 0,
                      summary?.total_reviews ?? 0
                    ),
                  }}
                />
              </span>
              <span className="text-right text-gray-500">
                {summary?.rating_counts?.[String(rating)] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {items.length ? (
          items.map((review) => (
            <article
              key={review.id}
              className="rounded-rounded border border-gray-100 p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Stars rating={review.rating} />
                <span className="text-sm font-bold">
                  {review.rating.toFixed(1)}
                </span>
                {review.verified_purchase && (
                  <span className="rounded-base bg-green-50 px-2 py-1 text-[11px] font-bold uppercase text-green-700">
                    Verified purchase
                  </span>
                )}
              </div>
              {review.title && (
                <h3 className="mt-3 text-base font-black">{review.title}</h3>
              )}
              <p className="mt-2 text-sm leading-6 text-gray-700">{review.content}</p>
              <p className="mt-3 text-xs text-gray-500">
                {review.customer_display_name ?? "Customer"}
                {review.created_at ? ` - ${formatReviewDate(review.created_at)}` : ""}
              </p>
            </article>
          ))
        ) : (
          <div className="rounded-rounded border border-dashed border-gray-200 p-6 text-sm text-gray-500">
            No approved reviews are available for this product yet.
          </div>
        )}
      </div>
    </div>
  )
}

function AdditionalContent({ detail }: { detail: ProductDetailResponse | null }) {
  return (
    <div className="grid gap-4 text-sm small:grid-cols-2">
      {detail?.catalog_profile?.condition_label && (
        <InfoRow label="Condition" value={detail.catalog_profile.condition_label} />
      )}
      {detail?.catalog_profile?.delivery_summary && (
        <InfoRow label="Delivery" value={detail.catalog_profile.delivery_summary} />
      )}
      {detail?.warranty?.name && <InfoRow label="Warranty" value={detail.warranty.name} />}
      {detail?.brand?.name && <InfoRow label="Brand" value={detail.brand.name} />}
    </div>
  )
}

function SpecificationsContent({ detail }: { detail: ProductDetailResponse | null }) {
  if (!detail?.specification_groups.length) {
    return <p className="text-sm text-gray-500">Specifications are not available.</p>
  }

  return (
    <div className="space-y-6">
      {detail.specification_groups.map((group) => (
        <div key={group.group.id}>
          <h3 className="mb-3 text-base font-black">{group.group.name}</h3>
          <div className="overflow-hidden rounded-rounded border border-gray-100">
            {group.specifications.map((spec) => (
              <InfoRow
                key={spec.definition_id}
                label={spec.definition?.name ?? spec.definition_id}
                value={formatSpecValue(spec.value, spec.definition?.unit)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null
  return (
    <div className="grid gap-2 px-4 py-3 text-sm small:grid-cols-[220px_1fr]">
      <span className="font-bold text-gray-500">{label}</span>
      <span>{value}</span>
    </div>
  )
}

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating)
  return (
    <span className="inline-flex items-center gap-0.5 text-xs" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={index < rounded ? "text-brand" : "text-gray-300"}
        >
          ★
        </span>
      ))}
    </span>
  )
}

function formatSpecValue(value: unknown, unit?: string | null): string {
  if (value === null || value === undefined) return "-"
  if (Array.isArray(value)) return value.map((item) => formatSpecValue(item)).join(", ")
  if (typeof value === "object") {
    const data = value as Record<string, unknown>
    if ("length" in data || "width" in data || "height" in data) {
      const dimensions = [data.length, data.width, data.height].filter(Boolean).join(" x ")
      const dimensionUnit = typeof data.unit === "string" ? data.unit : unit
      return dimensionUnit ? `${dimensions} ${dimensionUnit}` : dimensions
    }
    return Object.values(data).filter(Boolean).join(", ")
  }
  if (typeof value === "boolean") return value ? "Yes" : "No"
  return unit && typeof value === "number" ? `${value} ${unit}` : String(value)
}

function reviewPercentage(count: number, total: number) {
  if (!total) {
    return "0%"
  }
  return `${Math.round((count / total) * 100)}%`
}

function formatReviewDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

function formatInstallmentRate(value: number) {
  const rate = Number(value)
  if (!Number.isFinite(rate)) {
    return ""
  }
  return `${Number.isInteger(rate) ? rate.toFixed(0) : rate.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}%`
}

function colorValue(value: string) {
  const normalized = value.toLowerCase()
  if (normalized.includes("blue")) return "#9db7c9"
  if (normalized.includes("purple")) return "#5b5168"
  if (normalized.includes("black")) return "#111111"
  if (normalized.includes("white")) return "#ffffff"
  if (normalized.includes("red")) return "#d9483b"
  if (normalized.includes("green")) return "#4f9a5b"
  return "#d8d8d8"
}

function ScaleIcon({ size = 15, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m16 16 3-8 3 8c-.9.7-1.9 1-3 1s-2.1-.3-3-1Z" />
      <path d="m2 16 3-8 3 8c-.9.7-1.9 1-3 1s-2.1-.3-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 8h18" />
    </svg>
  )
}
