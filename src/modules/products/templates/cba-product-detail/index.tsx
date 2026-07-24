"use client"

import { addBundleToCart, addToCart } from "@lib/data/cart"
import type { FeaturedProductCard } from "@lib/data/featured-products"
import type {
  ProductDetailResponse,
  ProductReviewsResponse,
} from "@lib/data/product-detail"
import { addProductToWishlist } from "@lib/data/wishlist"
import { getProductPrice } from "@lib/util/get-product-price"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  HeartIcon,
  ShoppingCartIcon,
} from "@modules/layout/components/cba-icons"
import { isEqual } from "lodash"
import Image from "next/image"
import {
  Dispatch,
  SetStateAction,
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
  bundleProducts: FeaturedProductCard[]
}

type ActionState = {
  type: "success" | "error" | null
  message: string
}

const MAX_COMPARE_ITEMS = 4

function optionsAsKeymap(
  variantOptions: HttpTypes.StoreProductVariant["options"]
) {
  return variantOptions?.reduce((acc: Record<string, string>, option: any) => {
    acc[option.option_id] = option.value
    return acc
  }, {})
}

function initialOptions(product: HttpTypes.StoreProduct) {
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
  bundleProducts,
}: CbaProductDetailProps) {
  const galleryImages = images.length ? images : product.thumbnail
    ? [{ id: "thumbnail", url: product.thumbnail } as HttpTypes.StoreProductImage]
    : []
  const [activeImage, setActiveImage] = useState(galleryImages[0]?.url ?? "")
  const [options, setOptions] = useState<Record<string, string | undefined>>(
    initialOptions(product)
  )
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState("description")
  const [actionState, setActionState] = useState<ActionState>({
    type: null,
    message: "",
  })
  const [bundleSelection, setBundleSelection] = useState<Record<string, boolean>>(
    () => Object.fromEntries(bundleProducts.map((item) => [item.id, true]))
  )
  const [isPending, startTransition] = useTransition()

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
  const reviewCount = detail?.review_summary?.total_reviews ?? 0
  const rating = detail?.review_summary?.average_rating ?? null
  const selectedBundle = bundleProducts.filter((item) => bundleSelection[item.id])
  const bundleTotal = selectedBundle.reduce((total, item) => {
    return total + (item.price.calculated_amount ?? 0)
  }, price?.calculated_price_number ?? 0)
  const shortDescription =
    detail?.catalog_profile?.short_description ?? product.description ?? ""
  const bulletSpecs =
    detail?.specification_groups
      .flatMap((group) => group.specifications)
      .slice(0, 3) ?? []

  function setOptionValue(optionId: string, value: string) {
    setOptions((current) => ({ ...current, [optionId]: value }))
  }

  function clampQuantity(value: number) {
    setQuantity(Math.min(99, Math.max(1, Number.isFinite(value) ? value : 1)))
  }

  function submitAddToCart() {
    if (!selectedVariant?.id || !isValidVariant) {
      setActionState({ type: "error", message: "Select a valid product option." })
      return
    }
    if (!inStock) {
      setActionState({ type: "error", message: "This selection is out of stock." })
      return
    }

    startTransition(async () => {
      try {
        await addToCart({
          variantId: selectedVariant.id,
          quantity,
          countryCode,
        })
        setActionState({ type: "success", message: "Added to cart." })
      } catch (error) {
        setActionState({
          type: "error",
          message: error instanceof Error ? error.message : "Could not add to cart.",
        })
      }
    })
  }

  function submitWishlist() {
    if (!selectedVariant?.id || !isValidVariant) {
      setActionState({ type: "error", message: "Select a valid product option." })
      return
    }

    startTransition(async () => {
      const result = await addProductToWishlist({
        productId: product.id,
        variantId: selectedVariant.id,
      })
      setActionState({
        type: result.success ? "success" : "error",
        message: result.message,
      })
    })
  }

  function submitBundle() {
    const items = [
      selectedVariant?.id ? { variantId: selectedVariant.id, quantity } : null,
      ...selectedBundle
        .map((item) =>
          item.default_variant?.id
            ? { variantId: item.default_variant.id, quantity: 1 }
            : null
        )
        .filter(Boolean),
    ].filter(Boolean) as Array<{ variantId: string; quantity: number }>

    if (!items.length) {
      setActionState({ type: "error", message: "Select bundle products first." })
      return
    }

    startTransition(async () => {
      try {
        await addBundleToCart({ items, countryCode })
        setActionState({ type: "success", message: "Bundle added to cart." })
      } catch (error) {
        setActionState({
          type: "error",
          message: error instanceof Error ? error.message : "Could not add bundle.",
        })
      }
    })
  }

  function addToCompare() {
    try {
      const current = JSON.parse(
        window.localStorage.getItem("cba_compare_products") ?? "[]"
      ) as string[]
      const next = [product.id, ...current.filter((id) => id !== product.id)].slice(
        0,
        MAX_COMPARE_ITEMS
      )
      window.localStorage.setItem("cba_compare_products", JSON.stringify(next))
      setActionState({ type: "success", message: "Added to compare." })
    } catch {
      setActionState({ type: "error", message: "Compare is unavailable." })
    }
  }

  return (
    <main className="bg-white text-[#191919]">
      <div className="content-container py-8">
        <Breadcrumbs product={product} />

        <section className="grid gap-8 pt-7 small:grid-cols-[1.05fr_1fr_310px]">
          <ProductGallery
            title={product.title}
            images={galleryImages}
            activeImage={activeImage}
            setActiveImage={setActiveImage}
          />

          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {detail?.badges.map((badge) => (
                <span
                  key={badge.code}
                  className="rounded-base bg-[#ff5c0e]/10 px-3 py-1 text-[11px] font-bold uppercase text-brand"
                >
                  {badge.label}
                </span>
              ))}
            </div>
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
              <p className="mt-3 text-2xl font-bold">
                {price.calculated_price}
              </p>
            )}
            <ul className="mt-4 space-y-1.5 text-sm text-gray-700">
              {shortDescription && <li>{shortDescription}</li>}
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

            <div className="mt-5 flex flex-wrap gap-2 border-b border-gray-200 pb-5">
              {detail?.badges.map((badge) => (
                <span
                  key={`promo-${badge.code}`}
                  className="rounded-base bg-green-50 px-3 py-2 text-xs font-bold uppercase text-green-700"
                >
                  {badge.label}
                </span>
              ))}
            </div>

            <div className="mt-5 space-y-5">
              {(product.options ?? []).map((option) => (
                <ProductOptionGroup
                  key={option.id}
                  option={option}
                  current={options[option.id]}
                  updateOption={setOptionValue}
                  disabled={isPending}
                />
              ))}
            </div>

            <ProductMeta product={product} brandName={detail?.brand?.name} />
          </div>

          <aside className="h-fit rounded-rounded bg-[#f3f5fb] p-6">
            <p className="text-xs font-bold uppercase text-gray-500">Total Price</p>
            <p className="mt-2 text-[30px] font-black leading-tight">
              {price?.calculated_price ?? "Price unavailable"}
            </p>
            {detail?.catalog_profile?.installment_eligible && (
              <p className="mt-2 text-xs text-blue-600">
                Installment plans available.
              </p>
            )}
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
            <div className="mt-4 grid grid-cols-[44px_1fr_44px] overflow-hidden rounded-base border border-gray-200 bg-white">
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
                className="h-11 border-x border-gray-200 text-center text-sm font-bold outline-none"
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
              disabled={!selectedVariant || !isValidVariant || !inStock || isPending}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-base border border-brand bg-white text-xs font-bold uppercase text-brand transition hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCartIcon size={16} />
              Add to cart
            </button>
            <div className="mt-5 flex items-center justify-between text-xs text-gray-600">
              <button
                type="button"
                onClick={submitWishlist}
                className="flex items-center gap-2 hover:text-brand"
                disabled={isPending}
              >
                <HeartIcon size={15} className="text-green-600" />
                Wishlist
              </button>
              <button
                type="button"
                onClick={addToCompare}
                className="hover:text-brand"
              >
                Compare
              </button>
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

        <BundleSection
          product={product}
          price={price}
          bundleProducts={bundleProducts}
          selected={bundleSelection}
          setSelected={setBundleSelection}
          total={bundleTotal}
          onAdd={submitBundle}
          disabled={isPending || !selectedVariant}
        />

        <ProductTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          product={product}
          detail={detail}
          reviews={reviews}
        />
      </div>
    </main>
  )
}

function Breadcrumbs({ product }: { product: HttpTypes.StoreProduct }) {
  const category = product.categories?.[0]

  return (
    <nav className="rounded-rounded border border-gray-100 px-6 py-5 text-xs font-semibold text-gray-400">
      <LocalizedClientLink href="/" className="hover:text-brand">
        Home
      </LocalizedClientLink>
      <span className="mx-3">/</span>
      <LocalizedClientLink href="/store" className="hover:text-brand">
        Shop
      </LocalizedClientLink>
      {category?.handle && (
        <>
          <span className="mx-3">/</span>
          <LocalizedClientLink
            href={`/categories/${category.handle}`}
            className="hover:text-brand"
          >
            {category.name}
          </LocalizedClientLink>
        </>
      )}
      <span className="mx-3">/</span>
      <span className="text-gray-900">{product.title}</span>
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
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-rounded bg-gray-50">
        {activeImage ? (
          <Image
            src={activeImage}
            alt={title}
            fill
            priority
            sizes="(max-width: 1024px) 92vw, 520px"
            className="object-contain p-8"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No image
          </div>
        )}
      </div>
      <div className="mt-5 flex gap-4">
        {images.slice(0, 5).map((image, index) => (
          <button
            type="button"
            key={image.id ?? image.url ?? index}
            onClick={() => image.url && setActiveImage(image.url)}
            className={
              image.url === activeImage
                ? "relative h-20 w-20 rounded-base border-2 border-brand bg-white"
                : "relative h-20 w-20 rounded-base border border-gray-200 bg-white"
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
  brandName,
}: {
  product: HttpTypes.StoreProduct
  brandName?: string
}) {
  const sku = product.variants?.find((variant) => variant.sku)?.sku
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

function BundleSection({
  product,
  price,
  bundleProducts,
  selected,
  setSelected,
  total,
  onAdd,
  disabled,
}: {
  product: HttpTypes.StoreProduct
  price: ReturnType<typeof getProductPrice>["cheapestPrice"]
  bundleProducts: FeaturedProductCard[]
  selected: Record<string, boolean>
  setSelected: Dispatch<SetStateAction<Record<string, boolean>>>
  total: number
  onAdd: () => void
  disabled: boolean
}) {
  if (!bundleProducts.length) {
    return null
  }

  const currencyCode = price?.currency_code ?? bundleProducts[0]?.price.currency_code ?? "lkr"

  return (
    <section className="mt-12 grid gap-4 small:grid-cols-[1fr_330px]">
      <div className="rounded-rounded border border-gray-200 p-7">
        <h2 className="text-lg font-black uppercase">Frequently Bought Together</h2>
        <div className="mt-7 flex flex-wrap items-center gap-5">
          <BundleProductImage title={product.title} image={product.thumbnail} />
          {bundleProducts.map((item) => (
            <div key={item.id} className="flex items-center gap-5">
              <span className="flex h-7 w-7 items-center justify-center rounded-circle bg-gray-100 text-lg font-bold">
                +
              </span>
              <BundleProductImage title={item.title} image={item.thumbnail?.url} />
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-2 text-sm">
          {bundleProducts.map((item) => (
            <label key={item.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={Boolean(selected[item.id])}
                onChange={(event) =>
                  setSelected((current) => ({
                    ...current,
                    [item.id]: event.target.checked,
                  }))
                }
              />
              <span>
                {item.title}{" "}
                {item.price.calculated_amount !== null && (
                  <strong className="text-brand">
                    {convertToLocale({
                      amount: item.price.calculated_amount,
                      currency_code: item.price.currency_code,
                    })}
                  </strong>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="rounded-rounded border border-gray-200 p-7">
        <p className="text-xs font-bold uppercase text-gray-500">Total Price</p>
        <p className="mt-2 text-3xl font-black">
          {convertToLocale({ amount: total, currency_code: currencyCode })}
        </p>
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          className="mt-5 h-12 w-full rounded-base border border-brand text-xs font-bold uppercase text-brand hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add to cart
        </button>
      </div>
    </section>
  )
}

function BundleProductImage({
  title,
  image,
}: {
  title: string
  image?: string | null
}) {
  return (
    <div className="relative h-32 w-32 rounded-base bg-gray-50">
      {image && (
        <Image
          src={image}
          alt={title}
          fill
          sizes="128px"
          className="object-contain p-3"
        />
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
    { key: "reviews", label: `Reviews (${detail?.review_summary?.total_reviews ?? 0})` },
    { key: "additional", label: "Additional Information" },
    { key: "specifications", label: "Specifications" },
  ]

  return (
    <section className="mt-12">
      <div className="flex gap-8 overflow-x-auto border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={
              activeTab === tab.key
                ? "border-b-2 border-brand py-4 text-sm font-black uppercase text-black"
                : "py-4 text-sm font-bold uppercase text-gray-400 hover:text-black"
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
        {activeTab === "reviews" && <ReviewsContent detail={detail} reviews={reviews} />}
        {activeTab === "additional" && <AdditionalContent detail={detail} />}
        {activeTab === "specifications" && <SpecificationsContent detail={detail} />}
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
  if (!detail?.detail_sections.length) {
    return (
      <p className="max-w-5xl text-sm leading-7 text-gray-700">
        {product.description || "Product description is not available."}
      </p>
    )
  }

  return (
    <div className="space-y-9">
      {detail.detail_sections.map((section) => (
        <DescriptionSection key={section.id} section={section} />
      ))}
    </div>
  )
}

function DescriptionSection({
  section,
}: {
  section: ProductDetailResponse["detail_sections"][number]
}) {
  if (section.layout === "image_grid") {
    return (
      <article>
        <div className="grid gap-4 small:grid-cols-2">
          {(section.images ?? [])
            .filter((image) => image.url)
            .slice(0, 2)
            .map((image, index) => (
              <SectionImage
                key={`${image.url}-${index}`}
                imageUrl={image.url}
                altText={image.alt_text ?? section.title ?? "Product detail image"}
                aspectClassName="aspect-[4/3]"
              />
            ))}
        </div>
      </article>
    )
  }

  if (section.layout === "image_full") {
    return section.media_url ? (
      <article>
        <SectionImage
          imageUrl={section.media_url}
          altText={section.media_alt_text ?? "Product detail image"}
          aspectClassName="aspect-[16/7]"
        />
      </article>
    ) : null
  }

  if (section.layout === "image_left" || section.layout === "image_right") {
    return (
      <article className="grid gap-6 small:grid-cols-2 small:items-center">
        {section.media_url && section.layout === "image_left" && (
          <SectionImage
            imageUrl={section.media_url}
            altText={section.media_alt_text ?? section.title ?? "Product detail image"}
            aspectClassName="aspect-[4/3]"
          />
        )}
        <SectionCopy section={section} />
        {section.media_url && section.layout === "image_right" && (
          <SectionImage
            imageUrl={section.media_url}
            altText={section.media_alt_text ?? section.title ?? "Product detail image"}
            aspectClassName="aspect-[4/3]"
          />
        )}
      </article>
    )
  }

  return (
    <article className="space-y-4">
      <SectionCopy section={section} />
    </article>
  )
}

function SectionCopy({
  section,
}: {
  section: ProductDetailResponse["detail_sections"][number]
}) {
  if (!section.title && !section.subtitle && !section.body_html) {
    return null
  }

  return (
    <div>
      {section.title && <h3 className="text-lg font-black">{section.title}</h3>}
      {section.subtitle && (
        <p className="mt-2 text-sm text-gray-500">{section.subtitle}</p>
      )}
      {section.body_html && (
        <div
          className="mt-4 max-w-5xl text-sm leading-7 text-gray-700"
          dangerouslySetInnerHTML={{ __html: section.body_html }}
        />
      )}
    </div>
  )
}

function SectionImage({
  imageUrl,
  altText,
  aspectClassName,
}: {
  imageUrl: string
  altText: string
  aspectClassName: string
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-rounded bg-gray-100 ${aspectClassName}`}
    >
      <Image
        src={imageUrl}
        alt={altText}
        fill
        sizes="(max-width: 1024px) 92vw, 1120px"
        className="object-cover"
      />
    </div>
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
    <span className="text-brand" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index}>{index < rounded ? "*" : "*"}</span>
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
