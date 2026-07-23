"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import type { ShopSidebarPromoContent } from "@lib/data/shop-banner"
import type { StorefrontBrand } from "@lib/data/brands"
import type { StoreSearchFacet, StoreSearchFilters, StoreSearchSort } from "@lib/data/store-search"
import type { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ShopFilterPanelProps = {
  categories: HttpTypes.StoreProductCategory[]
  brands: StorefrontBrand[]
  facets: StoreSearchFacet[]
  selectedCategory?: string
  selectedBrand?: string
  selectedMinPrice?: number
  selectedMaxPrice?: number
  priceRangeMax: number
  selectedFilters: StoreSearchFilters
  sidebarPromo?: ShopSidebarPromoContent | null
}

const sortOptions: Array<{ value: StoreSearchSort; label: string }> = [
  { value: "relevance", label: "Default" },
  { value: "newest", label: "Newest" },
  { value: "title", label: "Name A-Z" },
  { value: "-title", label: "Name Z-A" },
]

export default function ShopFilterPanel({
  categories,
  brands,
  facets,
  selectedCategory,
  selectedBrand,
  selectedMinPrice,
  selectedMaxPrice,
  priceRangeMax,
  selectedFilters,
  sidebarPromo,
}: ShopFilterPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [categoryQuery, setCategoryQuery] = useState("")
  const [brandQuery, setBrandQuery] = useState("")
  const [priceMin, setPriceMin] = useState(String(selectedMinPrice ?? 0))
  const [priceMax, setPriceMax] = useState(
    String(selectedMaxPrice ?? priceRangeMax)
  )
  const sliderMax = Math.max(priceRangeMax, 1)
  const minValue = Math.min(normalizePriceInput(priceMin, sliderMax), sliderMax)
  const maxValue = Math.min(
    Math.max(normalizePriceInput(priceMax, sliderMax), minValue),
    sliderMax
  )
  const minPercent = (minValue / sliderMax) * 100
  const maxPercent = (maxValue / sliderMax) * 100

  useEffect(() => {
    setPriceMin(String(selectedMinPrice ?? 0))
    setPriceMax(String(selectedMaxPrice ?? priceRangeMax))
  }, [selectedMinPrice, selectedMaxPrice, priceRangeMax])
  const visibleCategories = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase()
    if (!query) {
      return categories
    }
    return categories.filter((category) =>
      category.name.toLowerCase().includes(query)
    )
  }, [categories, categoryQuery])
  const visibleBrands = useMemo(() => {
    const query = brandQuery.trim().toLowerCase()
    if (!query) {
      return brands
    }
    return brands.filter((brand) => brand.name.toLowerCase().includes(query))
  }, [brands, brandQuery])

  function pushParams(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams)
    mutator(params)
    params.delete("page")
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  function toggleCategory(categoryId: string) {
    pushParams((params) => {
      if (selectedCategory === categoryId) {
        params.delete("category")
      } else {
        params.set("category", categoryId)
      }
    })
  }

  function toggleBrand(brandId: string) {
    pushParams((params) => {
      if (selectedBrand === brandId) {
        params.delete("brand")
      } else {
        params.set("brand", brandId)
      }
    })
  }

  function toggleFilter(key: string, value: string) {
    const nextFilters: StoreSearchFilters = JSON.parse(
      JSON.stringify(selectedFilters)
    )
    const values = new Set(nextFilters[key] ?? [])
    if (values.has(value)) {
      values.delete(value)
    } else {
      values.add(value)
    }
    if (values.size) {
      nextFilters[key] = Array.from(values)
    } else {
      delete nextFilters[key]
    }

    pushParams((params) => {
      if (Object.keys(nextFilters).length) {
        params.set("filters", JSON.stringify(nextFilters))
      } else {
        params.delete("filters")
      }
    })
  }

  function resetAll() {
    pushParams((params) => {
      params.delete("category")
      params.delete("brand")
      params.delete("min_price")
      params.delete("max_price")
      params.delete("price_range")
      params.delete("filters")
      params.delete("sortBy")
    })
  }

  function applyPrice() {
    const min = normalizePriceInput(priceMin, sliderMax)
    const max = normalizePriceInput(priceMax, sliderMax)
    const hasPriceFilter = min > 0 || (max > 0 && max < sliderMax)
    pushParams((params) => {
      if (min > 0) {
        params.set("min_price", String(min))
      } else {
        params.delete("min_price")
      }
      if (max > 0 && max < sliderMax) {
        params.set("max_price", String(Math.max(min, max)))
      } else {
        params.delete("max_price")
      }
      if (hasPriceFilter) {
        params.set("price_range", String(sliderMax))
      } else {
        params.delete("price_range")
      }
    })
  }

  return (
      <aside className="small:w-[260px] small:flex-none">
        <div className="rounded-[8px] border border-[#e5e7eb] bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[18px] font-bold uppercase leading-6 text-black">
            Categories
          </h2>
          <button
            type="button"
            onClick={resetAll}
            className="text-[13px] font-medium leading-5 text-[#4b4b52] transition-colors hover:text-brand"
          >
            Reset All
          </button>
        </div>

        <input
          type="search"
          value={categoryQuery}
          onChange={(event) => setCategoryQuery(event.target.value)}
          aria-label="Search categories"
          placeholder="Search categories"
          className="mt-5 h-10 w-full rounded-[6px] border border-[#eeeeee] bg-white px-3 text-[14px] leading-5 text-[#2d2d2d] outline-none transition-colors placeholder:text-[#a1a1aa] focus:border-brand focus:ring-2 focus:ring-brand/20"
        />

        <div className="mt-5 flex flex-col gap-4">
          {visibleCategories.map((category) => {
            const count = Array.isArray(category.products)
              ? category.products.length
              : undefined
            const checked = selectedCategory === category.id
            return (
              <label
                key={category.id}
                className="flex cursor-pointer items-center gap-2 text-[14px] leading-5 text-[#2d2d2d]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCategory(category.id)}
                  className="h-4 w-4 rounded border-[#d4d4d8] accent-brand"
                />
                <span className="min-w-0 flex-1 truncate">{category.name}</span>
                {typeof count === "number" && (
                  <span className="text-[#9ca3af]">({count})</span>
                )}
              </label>
            )
          })}
          {!visibleCategories.length && (
            <p className="text-[13px] leading-5 text-[#8a8a8f]">
              No matching categories.
            </p>
          )}
        </div>

        {!!brands.length && (
          <div className="mt-8 border-t border-[#eeeeee] pt-8">
            <h3 className="text-[15px] font-bold leading-6 text-black">
              By Brands
            </h3>
            <input
              type="search"
              value={brandQuery}
              onChange={(event) => setBrandQuery(event.target.value)}
              aria-label="Search brands"
              placeholder="Search brands"
              className="mt-5 h-10 w-full rounded-[6px] border border-[#eeeeee] bg-white px-3 text-[14px] leading-5 text-[#2d2d2d] outline-none transition-colors placeholder:text-[#a1a1aa] focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <div className="mt-5 flex max-h-[250px] flex-col gap-4 overflow-y-auto pr-1">
              {visibleBrands.map((brand) => {
                const checked = selectedBrand === brand.id
                return (
                  <label
                    key={brand.id}
                    className="flex cursor-pointer items-center gap-2 text-[14px] leading-5 text-[#2d2d2d]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBrand(brand.id)}
                      className="h-4 w-4 rounded border-[#d4d4d8] accent-brand"
                    />
                    <span className="min-w-0 flex-1 truncate">{brand.name}</span>
                  </label>
                )
              })}
              {!visibleBrands.length && (
                <p className="text-[13px] leading-5 text-[#8a8a8f]">
                  No matching brands.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 border-t border-[#eeeeee] pt-8">
          <h3 className="text-[15px] font-bold leading-6 text-black">
            By Price
          </h3>
          <div className="relative mt-6 h-5">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-[#eeeeee]" />
            <div
              className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-brand"
              style={{
                left: `${minPercent}%`,
                right: `${100 - maxPercent}%`,
              }}
            />
            <span
              className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand"
              style={{ left: `${minPercent}%` }}
            />
            <span
              className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand"
              style={{ left: `${maxPercent}%` }}
            />
            <input
              type="range"
              min={0}
              max={sliderMax}
              step={1000}
              value={minValue}
              onChange={(event) =>
                setPriceMin(
                  String(
                    Math.min(
                      Number(event.target.value),
                      normalizePriceInput(priceMax, sliderMax)
                    )
                  )
                )
              }
              aria-label="Minimum price"
              className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-5 w-full appearance-none bg-transparent opacity-0 [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto"
            />
            <input
              type="range"
              min={0}
              max={sliderMax}
              step={1000}
              value={maxValue}
              onChange={(event) =>
                setPriceMax(
                  String(
                    Math.max(
                      Number(event.target.value),
                      normalizePriceInput(priceMin, sliderMax)
                    )
                  )
                )
              }
              aria-label="Maximum price"
              className="pointer-events-none absolute inset-x-0 top-0 z-[4] h-5 w-full appearance-none bg-transparent opacity-0 [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto"
            />
          </div>
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_8px_minmax(0,1fr)_42px] items-center gap-1">
            <label className="flex h-10 min-w-0 items-center gap-0.5 rounded-[6px] bg-white px-1.5">
              <span className="shrink-0 text-[10px] font-bold text-black">
                LKR
              </span>
              <input
                type="number"
                min={0}
                value={String(minValue)}
                onChange={(event) => setPriceMin(event.target.value)}
                aria-label="Minimum price in LKR"
                className="min-w-0 flex-1 bg-transparent text-[10px] font-bold tabular-nums text-black outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </label>
            <span className="text-center text-[15px] text-black">-</span>
            <label className="flex h-10 min-w-0 items-center gap-0.5 rounded-[6px] bg-white px-1.5">
              <span className="shrink-0 text-[10px] font-bold text-black">
                LKR
              </span>
              <input
                type="number"
                min={0}
                value={String(maxValue)}
                onChange={(event) => setPriceMax(event.target.value)}
                aria-label="Maximum price in LKR"
                className="min-w-0 flex-1 bg-transparent text-[10px] font-bold tabular-nums text-black outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </label>
            <button
              type="button"
              onClick={applyPrice}
              className="h-10 rounded-[6px] bg-brand text-[12px] font-bold text-white transition-colors hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              Go
            </button>
          </div>
        </div>

        {!!facets.length && (
          <div className="mt-8 border-t border-[#eeeeee] pt-6">
            {facets.map((facet) => (
              <div key={facet.key} className="mb-7 last:mb-0">
                <h3 className="text-[15px] font-bold leading-6 text-black">
                  {facetLabel(facet.key)}
                </h3>
                <div className="mt-4 flex flex-col gap-3">
                  {facet.options.slice(0, 8).map((option) => {
                    const checked = selectedFilters[facet.key]?.includes(
                      option.value
                    )
                    return (
                      <label
                        key={option.value}
                        className="flex cursor-pointer items-center gap-2 text-[14px] leading-5 text-[#2d2d2d]"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(checked)}
                          onChange={() => toggleFilter(facet.key, option.value)}
                          className="h-4 w-4 rounded border-[#d4d4d8] accent-brand"
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {optionLabel(facet.key, option.value)}
                        </span>
                        <span className="text-[#9ca3af]">({option.count})</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        </div>

        {sidebarPromo && (
          <LocalizedClientLink
            href={sidebarPromo.href}
            className="relative mt-8 block aspect-[298/315] overflow-hidden rounded-[16px] bg-[#24262b] p-7 text-white transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {sidebarPromo.imageUrl && (
              <img
                src={sidebarPromo.imageUrl}
                alt={sidebarPromo.imageAltText}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div className="relative z-10 max-w-[210px]">
              <h3 className="text-[24px] font-bold leading-[30px] tracking-normal text-white">
                {sidebarPromo.title}
              </h3>
              <p className="mt-8 text-[12px] font-medium uppercase leading-5 text-white/45">
                {sidebarPromo.eyebrow}
              </p>
              {sidebarPromo.priceText && (
                <p className="mt-1 text-[22px] font-medium leading-8 text-[#00ff38]">
                  {sidebarPromo.priceText}
                </p>
              )}
            </div>
          </LocalizedClientLink>
        )}
      </aside>
  )
}

export function ShopSortSelect({ sortBy }: { sortBy: StoreSearchSort }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setSort(value: StoreSearchSort) {
    const params = new URLSearchParams(searchParams)
    if (value === "relevance") {
      params.delete("sortBy")
    } else {
      params.set("sortBy", value)
    }
    params.delete("page")
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="shop-sort"
        className="text-[14px] leading-5 text-[#7a7a80]"
      >
        Show item
      </label>
      <select
        id="shop-sort"
        value={sortBy}
        onChange={(event) => setSort(event.target.value as StoreSearchSort)}
        className="h-8 w-[124px] rounded-[5px] border border-[#e7e8f0] bg-[#f1f2f7] px-3 text-[12px] font-semibold leading-4 text-[#2d2d35] outline-none focus:ring-2 focus:ring-brand/35"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function facetLabel(value: string) {
  if (value === "stock_status") {
    return "Availability"
  }
  if (value === "average_rating_bucket") {
    return "Rating"
  }
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function optionLabel(key: string, value: string) {
  if (key === "stock_status") {
    return {
      in_stock: "In Stock",
      low_stock: "Low Stock",
      out_of_stock: "Out of Stock",
      backorder: "Backorder",
      not_managed: "Available",
      unavailable: "Unavailable",
    }[value] ?? facetLabel(value)
  }
  if (key === "average_rating_bucket") {
    return {
      "4.5_plus": "4.5 and up",
      "4_plus": "4.0 and up",
      "3_plus": "3.0 and up",
      below_3: "Below 3.0",
    }[value] ?? facetLabel(value)
  }
  return facetLabel(value)
}

function normalizePriceInput(value: string, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }
  return Math.min(Math.round(parsed), max)
}
