"use client"

import {
  searchCompareProducts,
  type ComparePageData,
} from "@lib/data/compare"
import type { FeaturedProductCard } from "@lib/data/featured-products"
import { convertToLocale } from "@lib/util/money"
import {
  addProductToCompareStorage,
  compareIdsQuery,
  DEFAULT_COMPARE_LIMIT,
  readStoredCompareIds,
  removeProductFromCompareStorage,
  writeStoredCompareIds,
} from "@lib/util/compare-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState, useTransition } from "react"

type CompareTemplateProps = {
  countryCode: string
  data: ComparePageData
  initialIds: string[]
}

export default function CompareTemplate({
  countryCode,
  data,
  initialIds,
}: CompareTemplateProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [selectedIds, setSelectedIds] = useState(initialIds)
  const [status, setStatus] = useState("")
  const [isPending, startTransition] = useTransition()

  const visibleIds = useMemo(
    () => data.products.map((product) => product.id),
    [data.products]
  )

  useEffect(() => {
    setSelectedIds(initialIds)
  }, [initialIds.join(",")])

  useEffect(() => {
    if (initialIds.length) {
      writeStoredCompareIds(initialIds)
      return
    }

    const storedIds = readStoredCompareIds()
    if (storedIds.length) {
      updateRoute(storedIds, { optimistic: false })
    }
  }, [])

  function updateRoute(ids: string[], options: { optimistic?: boolean } = {}) {
    const query = compareIdsQuery(ids)
    if (options.optimistic !== false) {
      setSelectedIds(ids)
    }
    startTransition(() => {
      router.replace(query ? `${pathname}?ids=${query}` : pathname, {
        scroll: false,
      })
      router.refresh()
    })
  }

  function removeProduct(productId: string) {
    const nextIds = removeProductFromCompareStorage(productId)
    setStatus("Product removed from compare.")
    updateRoute(nextIds)
  }

  async function shareComparison() {
    const ids = visibleIds.length ? visibleIds : selectedIds
    const query = compareIdsQuery(ids)
    const url = `${window.location.origin}${pathname}${query ? `?ids=${query}` : ""}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Compare Products",
          text: "Compare these products on Ebiz.",
          url,
        })
        setStatus("Comparison shared.")
        return
      }
      await navigator.clipboard.writeText(url)
      setStatus("Comparison link copied.")
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }
      try {
        await navigator.clipboard.writeText(url)
        setStatus("Comparison link copied.")
      } catch {
        setStatus("Could not share this comparison.")
      }
    }
  }

  const productCount = data.products.length
  const maxProducts = data.maxProducts || DEFAULT_COMPARE_LIMIT
  const currentGroupKeys = useMemo(
    () => data.products.flatMap((product) => product.compare_group_keys ?? []),
    [data.products]
  )

  function addProduct(product: FeaturedProductCard) {
    if (visibleIds.includes(product.id)) {
      setStatus("Product is already in compare.")
      return
    }

    if (visibleIds.length >= maxProducts) {
      setStatus(`Compare supports up to ${maxProducts} products.`)
      return
    }

    if (
      currentGroupKeys.length &&
      product.compare_group_keys.length &&
      !product.compare_group_keys.some((key) => currentGroupKeys.includes(key))
    ) {
      setStatus("This product belongs to a different compare group.")
      return
    }

    const result = addProductToCompareStorage(
      {
        id: product.id,
        compareGroupKeys: product.compare_group_keys,
      },
      { limit: maxProducts }
    )
    setStatus(result.message)
    if (result.success) {
      updateRoute(result.ids)
    }
  }

  return (
    <main className="bg-white">
      <section className="content-container py-12 small:py-16">
        <div className="flex flex-col gap-4 small:flex-row small:items-end small:justify-between">
          <div>
            <h1 className="text-[24px] font-black leading-8 text-black small:text-[26px]">
              Compare Products ({productCount})
            </h1>
            <p className="mt-1 max-w-2xl text-[14px] leading-6 text-[#5f6673]">
              Easily compare features, specifications and prices to choose the
              right product.
            </p>
          </div>

          <button
            type="button"
            onClick={shareComparison}
            disabled={!productCount}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-base border border-[#d9dee7] bg-white px-4 text-[13px] font-semibold text-[#606978] shadow-sm transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShareIcon size={16} />
            Share Comparison
          </button>
        </div>

        <CompareProductSearch
          countryCode={countryCode}
          disabled={productCount >= maxProducts}
          maxProducts={maxProducts}
          onAddProduct={addProduct}
          selectedIds={visibleIds}
        />

        {(status || data.warnings.length > 0) && (
          <div className="mt-5 space-y-2" aria-live="polite">
            {status && <p className="text-sm text-[#3f6f28]">{status}</p>}
            {data.warnings.map((warning) => (
              <p key={warning} className="text-sm text-[#b45309]">
                {warning}
              </p>
            ))}
          </div>
        )}

        {!productCount ? (
          <EmptyCompareState maxProducts={maxProducts} />
        ) : (
          <div className="mt-7 overflow-x-auto rounded-rounded border border-[#e8ebf0] bg-white shadow-[0_18px_50px_rgba(17,24,39,0.04)]">
            <div
              className="grid min-w-[980px]"
              style={{
                gridTemplateColumns: `minmax(220px, 300px) repeat(${productCount}, minmax(220px, 1fr))`,
              }}
            >
              <CompareLimitCell maxProducts={maxProducts} />
              {data.products.map((product) => (
                <ProductHeaderCell
                  key={product.id}
                  product={product}
                  removeProduct={removeProduct}
                  isPending={isPending}
                />
              ))}

              {data.rows.map((row) => (
                <CompareRowCells
                  key={row.id}
                  row={row}
                  products={data.products}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

function EmptyCompareState({ maxProducts }: { maxProducts: number }) {
  return (
    <div className="mt-7 flex min-h-[320px] items-center justify-center rounded-rounded border border-dashed border-[#d9dee7] bg-[#fafafa] px-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-circle bg-[#fff0ea] text-brand">
          <ScaleIcon size={24} />
        </div>
        <h2 className="mt-4 text-[22px] font-black text-black">
          No products selected
        </h2>
        <p className="mt-2 text-[14px] leading-6 text-[#5f6673]">
          Add up to {maxProducts} products from the store or open a shared
          comparison link.
        </p>
        <LocalizedClientLink
          href="/store"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-base bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-hover"
        >
          Browse products
        </LocalizedClientLink>
      </div>
    </div>
  )
}

function CompareProductSearch({
  countryCode,
  disabled,
  maxProducts,
  onAddProduct,
  selectedIds,
}: {
  countryCode: string
  disabled: boolean
  maxProducts: number
  onAddProduct: (product: FeaturedProductCard) => void
  selectedIds: string[]
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<FeaturedProductCard[]>([])
  const [message, setMessage] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const text = query.trim()
    if (text.length < 2 || disabled) {
      setResults([])
      setMessage("")
      setIsSearching(false)
      return
    }

    let active = true
    setIsSearching(true)
    const timer = window.setTimeout(() => {
      searchCompareProducts({
        query: text,
        countryCode,
        limit: 8,
      })
        .then((products) => {
          if (!active) return
          setResults(products.filter((product) => !selectedIds.includes(product.id)))
          setMessage(products.length ? "" : "No matching products found.")
        })
        .catch(() => {
          if (!active) return
          setResults([])
          setMessage("Product search is unavailable.")
        })
        .finally(() => {
          if (active) {
            setIsSearching(false)
          }
        })
    }, 250)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [query, countryCode, disabled, selectedIds.join(",")])

  function selectProduct(product: FeaturedProductCard) {
    onAddProduct(product)
    setQuery("")
    setResults([])
    setMessage("")
  }

  return (
    <div className="relative mt-7 max-w-3xl">
      <label
        htmlFor="compare-product-search"
        className="mb-2 block text-[13px] font-bold text-[#374151]"
      >
        Add product to compare
      </label>
      <div className="relative">
        <SearchIcon
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8494]"
        />
        <input
          id="compare-product-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={disabled}
          placeholder={
            disabled
              ? `Remove a product to add another. Maximum ${maxProducts}.`
              : "Search by product name, SKU, category or brand"
          }
          className="h-12 w-full rounded-base border border-[#d9dee7] bg-white pl-11 pr-4 text-[14px] text-black outline-none transition placeholder:text-[#9aa3b2] focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-[#f6f7f9]"
          autoComplete="off"
        />
      </div>
      {(isSearching || message || results.length > 0) && (
        <div className="absolute left-0 right-0 top-[78px] z-30 overflow-hidden rounded-rounded border border-[#e5e7eb] bg-white shadow-[0_18px_46px_rgba(17,24,39,0.12)]">
          {isSearching && (
            <p className="px-4 py-3 text-sm text-[#6b7280]">Searching...</p>
          )}
          {!isSearching && message && (
            <p className="px-4 py-3 text-sm text-[#6b7280]">{message}</p>
          )}
          {!isSearching &&
            results.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => selectProduct(product)}
                className="grid w-full grid-cols-[54px_1fr_auto] items-center gap-3 border-b border-[#f0f1f3] px-4 py-3 text-left transition last:border-b-0 hover:bg-[#fff8f4]"
              >
                <span className="relative block h-12 w-12 overflow-hidden rounded-base bg-[#f7f7f8]">
                  {product.thumbnail?.url ? (
                    <Image
                      src={product.thumbnail.url}
                      alt={product.thumbnail.alt || product.title}
                      fill
                      sizes="48px"
                      className="object-contain p-1"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center">
                      <PlaceholderImage size={22} />
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-bold text-black">
                    {product.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-[#6b7280]">
                    {[product.brand?.name, product.category?.name]
                      .filter(Boolean)
                      .join(" / ") || inventoryLabel(product.inventory.status)}
                  </span>
                </span>
                <span className="rounded-base bg-brand px-3 py-2 text-[12px] font-bold text-white">
                  Add
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

function CompareLimitCell({ maxProducts }: { maxProducts: number }) {
  return (
    <div className="flex min-h-[268px] flex-col items-center justify-center border-b border-r border-[#e8ebf0] px-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-circle bg-[#fff0ea] text-[#6a7280]">
        <ScaleIcon size={21} />
      </div>
      <p className="mt-5 text-[13px] font-bold leading-5 text-[#4b5563]">
        Compare up to
        <br />
        {maxProducts} products
      </p>
      <p className="mt-4 max-w-[150px] text-[12px] leading-5 text-[#6b7280]">
        Add more products to compare their features side by side.
      </p>
    </div>
  )
}

function ProductHeaderCell({
  product,
  removeProduct,
  isPending,
}: {
  product: ComparePageData["products"][number]
  removeProduct: (productId: string) => void
  isPending: boolean
}) {
  return (
    <div className="relative flex min-h-[268px] flex-col items-center justify-center border-b border-r border-[#e8ebf0] px-6 py-6 text-center last:border-r-0">
      <button
        type="button"
        onClick={() => removeProduct(product.id)}
        disabled={isPending}
        aria-label={`Remove ${product.title} from compare`}
        className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-circle text-[#6b7280] transition hover:bg-[#f4f4f5] hover:text-black disabled:opacity-50"
      >
        <CloseIcon size={17} />
      </button>
      <LocalizedClientLink href={`/products/${product.handle}`} className="block">
        <div className="relative mx-auto h-[104px] w-[150px]">
          {product.thumbnail?.url ? (
            <Image
              src={product.thumbnail.url}
              alt={product.thumbnail.alt || product.title}
              fill
              sizes="150px"
              className="object-contain"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <PlaceholderImage size={34} />
            </div>
          )}
        </div>
        <h2 className="mt-5 line-clamp-2 min-h-[44px] text-[15px] font-black leading-[22px] text-black">
          {product.title}
        </h2>
      </LocalizedClientLink>
      <p className="mt-2 text-[15px] font-black leading-6 text-black">
        {formatProductPrice(product)}
      </p>
      <p
        className={`mt-1 text-[13px] font-semibold ${
          product.inventory.in_stock || product.inventory.allow_backorder
            ? "text-[#2ca84d]"
            : "text-[#b91c1c]"
        }`}
      >
        {inventoryLabel(product.inventory.status)}
      </p>
    </div>
  )
}

function CompareRowCells({
  row,
  products,
}: {
  row: ComparePageData["rows"][number]
  products: ComparePageData["products"]
}) {
  return (
    <>
      <div className="flex min-h-[45px] items-center gap-3 border-b border-r border-[#e8ebf0] px-5 text-[13px] font-bold text-[#4b5563]">
        <RowIcon label={row.label} />
        <span>{row.label}</span>
      </div>
      {products.map((product, index) => (
        <div
          key={`${row.id}-${product.id}`}
          className={`flex min-h-[45px] items-center justify-center border-b border-r border-[#e8ebf0] px-5 text-center text-[13px] leading-5 text-[#4b5563] ${
            index === products.length - 1 ? "border-r-0" : ""
          } ${row.id === "native-price" ? "font-black text-brand" : ""}`}
        >
          {row.values[product.id] ?? "N/A"}
        </div>
      ))}
    </>
  )
}

function RowIcon({ label }: { label: string }) {
  const normalized = label.toLowerCase()
  if (normalized.includes("price")) return <TagIcon size={16} />
  if (normalized.includes("stock")) return <ShieldIcon size={16} />
  if (normalized.includes("warranty")) return <ShieldIcon size={16} />
  if (normalized.includes("weight")) return <BagIcon size={16} />
  if (normalized.includes("connect")) return <WifiIcon size={16} />
  if (normalized.includes("speed")) return <GaugeIcon size={16} />
  return <MonitorIcon size={16} />
}

function formatProductPrice(product: ComparePageData["products"][number]) {
  if (
    product.price.status !== "available" ||
    product.price.calculated_amount === null
  ) {
    return "Contact for price"
  }

  return convertToLocale({
    amount: product.price.calculated_amount,
    currency_code: product.price.currency_code,
    maximumFractionDigits: 2,
  })
}

function inventoryLabel(status: ComparePageData["products"][number]["inventory"]["status"]) {
  if (status === "in_stock" || status === "not_managed") return "In Stock"
  if (status === "low_stock") return "Low stock"
  if (status === "backorder") return "Available on backorder"
  if (status === "out_of_stock") return "Out of stock"
  return "Availability pending"
}

type IconProps = { size?: number; className?: string }

function iconProps(size: number, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  }
}

function ShareIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...iconProps(size, className)}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 10.5 6.8-4" />
      <path d="m8.6 13.5 6.8 4" />
    </svg>
  )
}

function SearchIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...iconProps(size, className)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function ScaleIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...iconProps(size, className)}>
      <path d="m16 16 3-8 3 8c-.9.7-1.9 1-3 1s-2.1-.3-3-1Z" />
      <path d="m2 16 3-8 3 8c-.9.7-1.9 1-3 1s-2.1-.3-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 8h18" />
    </svg>
  )
}

function CloseIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...iconProps(size, className)}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function MonitorIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...iconProps(size, className)}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
    </svg>
  )
}

function WifiIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...iconProps(size, className)}>
      <path d="M5 13a10 10 0 0 1 14 0" />
      <path d="M8.5 16.5a5 5 0 0 1 7 0" />
      <path d="M12 20h.01" />
    </svg>
  )
}

function GaugeIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...iconProps(size, className)}>
      <path d="M21 13a9 9 0 1 0-18 0" />
      <path d="m12 13 4-4" />
      <path d="M7 13h.01" />
      <path d="M17 13h.01" />
    </svg>
  )
}

function ShieldIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...iconProps(size, className)}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function BagIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...iconProps(size, className)}>
      <path d="M6 7h12l1 14H5L6 7Z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  )
}

function TagIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...iconProps(size, className)}>
      <path d="M20.6 13.1 13 20.7a2 2 0 0 1-2.8 0L3 13.5V3h10.5l7.1 7.1a2 2 0 0 1 0 3Z" />
      <path d="M7.5 7.5h.01" />
    </svg>
  )
}
