"use client"

import type { FeaturedProductCard } from "@lib/data/featured-products"
import { convertToLocale } from "@lib/util/money"
import { getStoreCountryCode, localizedPath } from "@lib/util/routes"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import { SearchIcon } from "@modules/layout/components/cba-icons"
import Image from "next/image"
import { useParams, usePathname, useRouter } from "next/navigation"
import {
  FormEvent,
  KeyboardEvent,
  MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

type AutocompleteResponse =
  | {
      success: true
      data: {
        suggestions: string[]
        products: FeaturedProductCard[]
      }
    }
  | {
      success: false
      error?: { message?: string }
    }

type ResultItem =
  | { key: string; type: "suggestion"; label: string }
  | { key: string; type: "product"; product: FeaturedProductCard }
  | { key: string; type: "view-all"; label: string }

const MIN_AUTOCOMPLETE_LENGTH = 2
const MAX_QUERY_LENGTH = 120
const DEBOUNCE_MS = 250
const SEARCH_LISTBOX_ID = "site-search-results"

export default function CbaSearchForm() {
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [products, setProducts] = useState<FeaturedProductCard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const countryCode = getStoreCountryCode(params.countryCode)
  const rootRef = useRef<HTMLFormElement>(null)

  const trimmedQuery = searchQuery.trim()
  const canAutocomplete =
    trimmedQuery.length >= MIN_AUTOCOMPLETE_LENGTH &&
    trimmedQuery.length <= MAX_QUERY_LENGTH

  const resultItems = useMemo<ResultItem[]>(() => {
    if (!canAutocomplete) {
      return []
    }

    return [
      ...suggestions.map((label) => ({
        key: `suggestion-${label}`,
        type: "suggestion" as const,
        label,
      })),
      ...products.map((product) => ({
        key: `product-${product.id}`,
        type: "product" as const,
        product,
      })),
      {
        key: "view-all",
        type: "view-all" as const,
        label: `View all results for "${trimmedQuery}"`,
      },
    ]
  }, [canAutocomplete, products, suggestions, trimmedQuery])

  const showDropdown =
    isOpen &&
    canAutocomplete &&
    (isLoading || Boolean(message) || resultItems.length > 0)

  useEffect(() => {
    if (!canAutocomplete) {
      setSuggestions([])
      setProducts([])
      setMessage("")
      setIsLoading(false)
      setActiveIndex(-1)
      return
    }

    let active = true
    let controller: AbortController | null = null
    setIsLoading(true)
    setMessage("")

    const timer = window.setTimeout(() => {
      controller = new AbortController()
      const query = new URLSearchParams({
        q: trimmedQuery,
        country_code: countryCode,
      })

      fetch(`/api/store-search/autocomplete?${query.toString()}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      })
        .then(async (response) => {
          const payload = (await response.json()) as AutocompleteResponse
          if (!response.ok || !payload.success) {
            throw new Error("Search autocomplete is unavailable.")
          }
          return payload.data
        })
        .then((data) => {
          if (!active) return
          setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : [])
          setProducts(Array.isArray(data.products) ? data.products : [])
          setMessage(
            data.suggestions.length || data.products.length
              ? ""
              : "No matching products found."
          )
          setActiveIndex(-1)
          setIsOpen(true)
        })
        .catch((error) => {
          if (!active || error instanceof DOMException && error.name === "AbortError") {
            return
          }
          setSuggestions([])
          setProducts([])
          setMessage("Search is unavailable right now.")
          setActiveIndex(-1)
          setIsOpen(true)
        })
        .finally(() => {
          if (active) {
            setIsLoading(false)
          }
        })
    }, DEBOUNCE_MS)

    return () => {
      active = false
      window.clearTimeout(timer)
      controller?.abort()
    }
  }, [canAutocomplete, countryCode, trimmedQuery])

  useEffect(() => {
    setIsOpen(false)
    setActiveIndex(-1)
  }, [pathname])

  useEffect(() => {
    function closeOnOutsideClick(event: globalThis.MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick)
    return () => document.removeEventListener("mousedown", closeOnOutsideClick)
  }, [])

  const submitSearch = (query: string) => {
    const text = query.trim().slice(0, MAX_QUERY_LENGTH)
    if (!text) {
      return
    }
    setIsOpen(false)
    setActiveIndex(-1)
    router.push(localizedPath(`/store?query=${encodeURIComponent(text)}`))
  }

  const openProduct = (product: FeaturedProductCard) => {
    if (!product.handle) {
      submitSearch(product.title)
      return
    }
    setIsOpen(false)
    setActiveIndex(-1)
    router.push(localizedPath(`/products/${encodeURIComponent(product.handle)}`))
  }

  const selectItem = (item: ResultItem) => {
    if (item.type === "suggestion") {
      setSearchQuery(item.label)
      submitSearch(item.label)
      return
    }
    if (item.type === "product") {
      openProduct(item.product)
      return
    }
    submitSearch(trimmedQuery)
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitSearch(searchQuery)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false)
      setActiveIndex(-1)
      return
    }

    if (!showDropdown || !resultItems.length) {
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % resultItems.length)
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((current) =>
        current <= 0 ? resultItems.length - 1 : current - 1
      )
      return
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault()
      selectItem(resultItems[activeIndex])
    }
  }

  const handleResultMouseDown = (
    event: MouseEvent<HTMLButtonElement>,
    item: ResultItem
  ) => {
    event.preventDefault()
    selectItem(item)
  }

  return (
    <form
      ref={rootRef}
      onSubmit={handleSearch}
      className="relative flex w-full items-center"
      role="search"
    >
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <input
        id="site-search"
        type="search"
        value={searchQuery}
        onChange={(event) => {
          setSearchQuery(event.target.value.slice(0, MAX_QUERY_LENGTH))
          setIsOpen(true)
        }}
        onFocus={() => {
          if (canAutocomplete) {
            setIsOpen(true)
          }
        }}
        onKeyDown={handleKeyDown}
        className="h-[46px] w-full rounded-l-[8px] border-[1.5px] border-r-0 border-[#DDE1E4] px-4 py-2.5 text-[16px] focus:border-brand focus:outline-none small:text-sm"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls={SEARCH_LISTBOX_ID}
        aria-activedescendant={
          activeIndex >= 0 ? `${SEARCH_LISTBOX_ID}-${activeIndex}` : undefined
        }
        placeholder="Search products, brands, SKUs"
      />
      <button
        type="submit"
        className="flex h-[46px] flex-shrink-0 items-center justify-center rounded-r-[8px] bg-brand px-6 text-white transition-colors hover:bg-brand-hover"
        aria-label="Search"
      >
        <SearchIcon size={18} strokeWidth={2.5} />
      </button>

      {showDropdown && (
        <div
          id={SEARCH_LISTBOX_ID}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-[52px] z-[80] max-h-[75vh] overflow-hidden rounded-[8px] border border-[#e5e7eb] bg-white shadow-[0_18px_46px_rgba(17,24,39,0.14)]"
        >
          {isLoading && (
            <p className="px-4 py-3 text-sm text-[#6b7280]" aria-live="polite">
              Searching...
            </p>
          )}

          {!isLoading && message && (
            <p className="px-4 py-3 text-sm text-[#6b7280]" aria-live="polite">
              {message}
            </p>
          )}

          {!isLoading &&
            resultItems.map((item, index) => (
              <SearchResultButton
                key={item.key}
                item={item}
                index={index}
                active={index === activeIndex}
                onMouseDown={handleResultMouseDown}
              />
            ))}
        </div>
      )}
    </form>
  )
}

function SearchResultButton({
  item,
  index,
  active,
  onMouseDown,
}: {
  item: ResultItem
  index: number
  active: boolean
  onMouseDown: (event: MouseEvent<HTMLButtonElement>, item: ResultItem) => void
}) {
  const optionId = `${SEARCH_LISTBOX_ID}-${index}`
  const className = `w-full border-b border-[#f0f1f3] px-4 py-3 text-left transition last:border-b-0 ${
    active ? "bg-[#fff8f4]" : "bg-white hover:bg-[#fff8f4]"
  }`

  if (item.type === "product") {
    return (
      <button
        id={optionId}
        type="button"
        role="option"
        aria-selected={active}
        onMouseDown={(event) => onMouseDown(event, item)}
        className={`grid grid-cols-[56px_1fr_auto] items-center gap-3 ${className}`}
      >
        <span className="relative block h-12 w-12 overflow-hidden rounded-[6px] bg-[#f7f7f8]">
          {item.product.thumbnail?.url ? (
            <Image
              src={item.product.thumbnail.url}
              alt={item.product.thumbnail.alt || item.product.title}
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
            {item.product.title}
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-[#6b7280]">
            {[item.product.brand?.name, item.product.category?.name]
              .filter(Boolean)
              .join(" / ") || inventoryLabel(item.product.inventory.status)}
          </span>
        </span>
        <span className="max-w-[120px] truncate text-right text-[12px] font-bold text-black">
          {formatProductPrice(item.product)}
        </span>
      </button>
    )
  }

  return (
    <button
      id={optionId}
      type="button"
      role="option"
      aria-selected={active}
      onMouseDown={(event) => onMouseDown(event, item)}
      className={`flex items-center justify-between gap-3 ${className}`}
    >
      <span className="min-w-0 truncate text-[14px] font-semibold text-black">
        {item.label}
      </span>
      <span className="flex-shrink-0 text-[12px] font-semibold text-brand">
        {item.type === "view-all" ? "View all" : "Search"}
      </span>
    </button>
  )
}

function formatProductPrice(product: FeaturedProductCard) {
  if (
    product.price.status !== "available" ||
    product.price.calculated_amount === null
  ) {
    return inventoryLabel(product.inventory.status)
  }

  return convertToLocale({
    amount: product.price.calculated_amount,
    currency_code: product.price.currency_code,
    maximumFractionDigits: 2,
  })
}

function inventoryLabel(status: FeaturedProductCard["inventory"]["status"]) {
  if (status === "in_stock" || status === "not_managed") return "In stock"
  if (status === "low_stock") return "Low stock"
  if (status === "backorder") return "Backorder"
  if (status === "out_of_stock") return "Out of stock"
  return "Availability pending"
}
