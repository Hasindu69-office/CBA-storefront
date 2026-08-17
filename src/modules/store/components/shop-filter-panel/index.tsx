"use client"

import { Dialog, Transition } from "@headlessui/react"
import { notify } from "@lib/notifications"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Fragment, type ReactNode, useEffect, useMemo, useState } from "react"

import type { ShopSidebarPromoContent } from "@lib/data/shop-banner"
import type { StorefrontBrand } from "@lib/data/brands"
import type { StoreSearchFacet, StoreSearchFilters, StoreSearchSort } from "@lib/data/store-search"
import type { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { XIcon } from "@modules/layout/components/cba-icons"

type ShopFilterPanelProps = {
  categories: HttpTypes.StoreProductCategory[]
  brands: StorefrontBrand[]
  facets: StoreSearchFacet[]
  selectedCategory?: string | string[]
  selectedBrand?: string | string[]
  selectedMinPrice?: number
  selectedMaxPrice?: number
  priceRangeMax: number
  selectedFilters: StoreSearchFilters
  sidebarPromo?: ShopSidebarPromoContent | null
  presentation?: "sidebar" | "drawer"
}

const sortOptions: Array<{ value: StoreSearchSort; label: string }> = [
  { value: "relevance", label: "Default" },
  { value: "newest", label: "Newest" },
  { value: "title", label: "Name A-Z" },
  { value: "-title", label: "Name Z-A" },
]

const FILTER_OPTION_LIST_CLASS =
  "flex max-h-[250px] flex-col gap-4 overflow-y-auto pr-1"
const MAX_SELECTED_FILTER_VALUES = 20

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
  presentation = "sidebar",
}: ShopFilterPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedCategories = useMemo(
    () => parseSelectedTokenParam(selectedCategory),
    [selectedCategory]
  )
  const selectedBrands = useMemo(
    () => parseSelectedTokenParam(selectedBrand),
    [selectedBrand]
  )
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
    const nextCategories = toggleSelectedToken(selectedCategories, categoryId)
    const isRemoving = nextCategories.length < selectedCategories.length
    if (nextCategories.length > MAX_SELECTED_FILTER_VALUES) {
      notify.warning(`You can select up to ${MAX_SELECTED_FILTER_VALUES} categories.`)
      return
    }

    pushParams((params) => {
      if (nextCategories.length) {
        params.set("category", nextCategories.join(","))
      } else {
        params.delete("category")
      }
    })
    notifyFilterChange(isRemoving ? "removed" : "applied")
  }

  function toggleBrand(brandId: string) {
    const nextBrands = toggleSelectedToken(selectedBrands, brandId)
    const isRemoving = nextBrands.length < selectedBrands.length
    if (nextBrands.length > MAX_SELECTED_FILTER_VALUES) {
      notify.warning(`You can select up to ${MAX_SELECTED_FILTER_VALUES} brands.`)
      return
    }

    pushParams((params) => {
      if (nextBrands.length) {
        params.set("brand", nextBrands.join(","))
      } else {
        params.delete("brand")
      }
    })
    notifyFilterChange(isRemoving ? "removed" : "applied")
  }

  function toggleFilter(key: string, value: string) {
    const nextFilters: StoreSearchFilters = JSON.parse(
      JSON.stringify(selectedFilters)
    )
    const values = toggleFilterValue(key, nextFilters[key] ?? [], value)
    if (values.length > (nextFilters[key] ?? []).length && values.length > MAX_SELECTED_FILTER_VALUES) {
      notify.warning(
        `You can select up to ${MAX_SELECTED_FILTER_VALUES} options in this section.`
      )
      return
    }
    if (values.length) {
      nextFilters[key] = values
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
    notifyFilterChange(
      values.length > (selectedFilters[key] ?? []).length ? "applied" : "removed"
    )
  }

  function toggleFilterValue(key: string, currentValues: string[], value: string) {
    if (key === "average_rating_bucket") {
      const score = ratingBucketValue(value)
      const hasValue = currentValues.some(
        (currentValue) => ratingBucketValue(currentValue) === score
      )
      if (hasValue) {
        return currentValues.filter(
          (currentValue) => ratingBucketValue(currentValue) !== score
        )
      }
      return [...currentValues, value]
    }

    const values = new Set(currentValues)
    if (values.has(value)) {
      values.delete(value)
    } else {
      values.add(value)
    }
    return Array.from(values)
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
    notifyFilterChange("cleared")
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
    notifyFilterChange(hasPriceFilter ? "applied" : "removed")
  }

  function notifyFilterChange(action: "applied" | "removed" | "cleared") {
    if (presentation !== "drawer") {
      return
    }

    const message =
      action === "applied"
        ? "Filter applied."
        : action === "removed"
          ? "Filter removed."
          : "Filters cleared."

    notify.success(message, { id: "store-filter" })
  }

  return (
      <aside
        className={
          presentation === "sidebar" ? "small:w-[260px] small:flex-none" : "w-full"
        }
      >
        <div
          className={
            presentation === "sidebar"
              ? "rounded-[8px] border border-[#e5e7eb] bg-white p-6"
              : "bg-white px-5 pb-6"
          }
        >
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

        <div className={`mt-5 ${FILTER_OPTION_LIST_CLASS}`}>
          {visibleCategories.map((category) => {
            const count = Array.isArray(category.products)
              ? category.products.length
              : undefined
            const checked = selectedCategories.includes(category.id)
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
            <div className={`mt-5 ${FILTER_OPTION_LIST_CLASS}`}>
              {visibleBrands.map((brand) => {
                const checked = selectedBrands.includes(brand.id)
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
                <div className={`mt-4 ${FILTER_OPTION_LIST_CLASS}`}>
                  {facet.options.map((option) => {
                    const checked = filterOptionSelected(
                      facet.key,
                      selectedFilters[facet.key],
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
                        <span className="min-w-0 flex-1">
                          {optionDisplay(facet.key, option.value)}
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

        {presentation === "sidebar" && sidebarPromo && (
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

export function StoreMobileFilterDrawer({
  resultCount,
  ...filterProps
}: Omit<ShopFilterPanelProps, "presentation" | "sidebarPromo"> & {
  resultCount: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const appliedFilters = useMemo(
    () =>
      buildAppliedFilterItems({
        categories: filterProps.categories,
        brands: filterProps.brands,
        facets: filterProps.facets,
        selectedCategory: filterProps.selectedCategory,
        selectedBrand: filterProps.selectedBrand,
        selectedMinPrice: filterProps.selectedMinPrice,
        selectedMaxPrice: filterProps.selectedMaxPrice,
        selectedFilters: filterProps.selectedFilters,
      }),
    [
      filterProps.categories,
      filterProps.brands,
      filterProps.facets,
      filterProps.selectedCategory,
      filterProps.selectedBrand,
      filterProps.selectedMinPrice,
      filterProps.selectedMaxPrice,
      filterProps.selectedFilters,
    ]
  )
  const appliedFilterCount = appliedFilters.length

  function pushParams(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams)
    mutator(params)
    params.delete("page")
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  function removeAppliedFilter(item: AppliedFilterItem) {
    pushParams((params) => {
      if (item.type === "category" || item.type === "brand") {
        const nextValues = parseSelectedTokenParam(params.get(item.type)).filter(
          (value) => value !== item.value
        )
        if (nextValues.length) {
          params.set(item.type, nextValues.join(","))
        } else {
          params.delete(item.type)
        }
        return
      }

      if (item.type === "price") {
        params.delete("min_price")
        params.delete("max_price")
        params.delete("price_range")
        return
      }

      if (item.type !== "facet") {
        return
      }

      const nextFilters = parseSelectedFiltersParam(params.get("filters"))
      const nextValues = (nextFilters[item.key] ?? []).filter(
        (value) => value !== item.value
      )

      if (nextValues.length) {
        nextFilters[item.key] = nextValues
      } else {
        delete nextFilters[item.key]
      }

      if (Object.keys(nextFilters).length) {
        params.set("filters", JSON.stringify(nextFilters))
      } else {
        params.delete("filters")
      }
    })
    notify.success("Filter removed.", { id: "store-filter" })
  }

  return (
    <>
      <div className="sticky top-0 z-30 -mx-[4.35%] border-y border-[#eeeeee] bg-white/95 px-[4.35%] py-3 backdrop-blur small:hidden">
        <div className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] border border-brand/20 bg-white px-4 text-[13px] font-bold text-[#2d2d35] shadow-[0_3px_12px_rgba(17,24,39,0.06)] transition-colors hover:border-brand hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
          >
            <FilterLibraryIcon />
            <span className="whitespace-nowrap">Filter Library</span>
            {appliedFilterCount > 0 && (
              <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold leading-none text-white">
                {appliedFilterCount}
              </span>
            )}
          </button>
          <div className="flex h-12 min-w-0 flex-col justify-center rounded-[8px] border border-[#fff2e6] bg-[#fff7f1] px-4 text-left">
            <span className="truncate text-[13px] font-bold leading-4 text-brand">
              The Library
            </span>
            <span className="mt-0.5 truncate text-[11px] font-medium leading-4 text-[#7a7a80]">
              {resultCount} {resultCount === 1 ? "Item" : "Items"}
            </span>
          </div>
        </div>

        {appliedFilters.length > 0 && (
          <div className="mt-3">
            <p className="sr-only">{appliedFilterCount} filters applied</p>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
              {appliedFilters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => removeAppliedFilter(item)}
                  className="inline-flex h-8 max-w-[210px] flex-shrink-0 items-center gap-2 rounded-full border border-brand/25 bg-[#fff7f1] px-3 text-[12px] font-semibold text-[#2d2d35] transition-colors hover:border-brand hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  aria-label={`Remove ${item.label} filter`}
                >
                  <span className="truncate">{item.label}</span>
                  <XIcon size={13} className="flex-shrink-0 text-brand" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[95] small:hidden" onClose={setIsOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/55 backdrop-blur-[2px]" />
          </Transition.Child>

          <div className="fixed inset-x-0 bottom-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="translate-y-full"
              enterTo="translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="translate-y-0"
              leaveTo="translate-y-full"
            >
              <Dialog.Panel
                className="max-h-[85svh] overflow-hidden rounded-t-[18px] bg-white shadow-[0_-18px_55px_rgba(17,24,39,0.24)]"
                data-testid="store-mobile-filter-drawer"
              >
                <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#eeeeee] bg-white px-5 py-4">
                  <div className="min-w-0">
                    <Dialog.Title className="text-[18px] font-bold leading-6 text-black">
                      Filter Library
                    </Dialog.Title>
                    <p className="mt-1 text-[12px] font-medium leading-4 text-[#7a7a80]">
                      {appliedFilterCount > 0
                        ? `${appliedFilterCount} ${
                            appliedFilterCount === 1 ? "filter" : "filters"
                          } applied`
                        : "No filters applied"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[#eeeeee] bg-white text-[#4b4b52] transition-colors hover:border-brand hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                    aria-label="Close filters"
                  >
                    <XIcon size={18} />
                  </button>
                </div>

                <div className="max-h-[calc(85svh-73px)] overflow-y-auto pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5">
                  <p
                    className="sr-only"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {appliedFilterCount > 0
                      ? `${appliedFilterCount} ${
                          appliedFilterCount === 1 ? "filter is" : "filters are"
                        } applied. ${resultCount} ${
                          resultCount === 1 ? "item" : "items"
                        } available.`
                      : `No filters applied. ${resultCount} ${
                          resultCount === 1 ? "item" : "items"
                        } available.`}
                  </p>
                  <ShopFilterPanel {...filterProps} presentation="drawer" />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
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
      "4.5-plus": "4.5 and up",
      "4_plus": "4.0 and up",
      "4-plus": "4.0 and up",
      "3_plus": "3.0 and up",
      "3-plus": "3.0 and up",
      below_3: "Below 3.0",
      "below-3": "Below 3.0",
    }[value] ?? facetLabel(value)
  }
  return facetLabel(value)
}

function optionDisplay(key: string, value: string): ReactNode {
  if (key === "average_rating_bucket") {
    return <RatingFacetOption value={value} />
  }

  return (
    <span className="block truncate">
      {optionLabel(key, value)}
    </span>
  )
}

function RatingFacetOption({ value }: { value: string }) {
  const rating = ratingBucketValue(value)
  const label = optionLabel("average_rating_bucket", value)

  return (
    <span
      className="flex items-center gap-0.5"
      aria-label={label}
      title={label}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < rating
        return (
          <span
            key={index}
            aria-hidden="true"
            className={`text-[17px] leading-none ${
              filled ? "text-brand" : "text-[#d4d4d8]"
            }`}
          >
            ★
          </span>
        )
      })}
    </span>
  )
}

function ratingBucketValue(value: string) {
  return {
    "4.5_plus": 5,
    "4.5-plus": 5,
    "4_plus": 4,
    "4-plus": 4,
    "3_plus": 3,
    "3-plus": 3,
    below_3: 2,
    "below-3": 2,
  }[value] ?? 0
}

function filterOptionSelected(
  key: string,
  selectedValues: string[] | undefined,
  optionValue: string
) {
  if (!selectedValues?.length) {
    return false
  }
  if (key !== "average_rating_bucket") {
    return selectedValues.includes(optionValue)
  }
  const optionScore = ratingBucketValue(optionValue)
  return selectedValues.some((value) => ratingBucketValue(value) === optionScore)
}

type AppliedFilterItem =
  | {
      id: string
      type: "category" | "brand" | "price"
      value?: string
      label: string
    }
  | {
      id: string
      type: "facet"
      key: string
      value: string
      label: string
    }

function buildAppliedFilterItems({
  categories,
  brands,
  facets,
  selectedCategory,
  selectedBrand,
  selectedMinPrice,
  selectedMaxPrice,
  selectedFilters,
}: {
  categories: HttpTypes.StoreProductCategory[]
  brands: StorefrontBrand[]
  facets: StoreSearchFacet[]
  selectedCategory?: string | string[]
  selectedBrand?: string | string[]
  selectedMinPrice?: number
  selectedMaxPrice?: number
  selectedFilters: StoreSearchFilters
}) {
  const items: AppliedFilterItem[] = []

  for (const categoryId of parseSelectedTokenParam(selectedCategory)) {
    const categoryName =
      categories.find((category) => category.id === categoryId)?.name ?? "Category"
    items.push({
      id: `category:${categoryId}`,
      type: "category",
      value: categoryId,
      label: categoryName,
    })
  }

  for (const brandId of parseSelectedTokenParam(selectedBrand)) {
    const brandName = brands.find((brand) => brand.id === brandId)?.name ?? "Brand"
    items.push({
      id: `brand:${brandId}`,
      type: "brand",
      value: brandId,
      label: brandName,
    })
  }

  if (
    (typeof selectedMinPrice === "number" && selectedMinPrice > 0) ||
    (typeof selectedMaxPrice === "number" && selectedMaxPrice > 0)
  ) {
    const minLabel =
      typeof selectedMinPrice === "number" && selectedMinPrice > 0
        ? formatPriceFilterValue(selectedMinPrice)
        : "Any"
    const maxLabel =
      typeof selectedMaxPrice === "number" && selectedMaxPrice > 0
        ? formatPriceFilterValue(selectedMaxPrice)
        : "Any"
    items.push({
      id: `price:${selectedMinPrice ?? ""}-${selectedMaxPrice ?? ""}`,
      type: "price",
      label: `${minLabel} - ${maxLabel}`,
    })
  }

  const facetKeys = new Set(facets.map((facet) => facet.key))
  for (const [key, values] of Object.entries(selectedFilters)) {
    if (!Array.isArray(values)) {
      continue
    }
    for (const value of values) {
      items.push({
        id: `facet:${key}:${value}`,
        type: "facet",
        key,
        value,
        label: facetKeys.has(key)
          ? `${facetLabel(key)}: ${optionLabel(key, value)}`
          : optionLabel(key, value),
      })
    }
  }

  return items
}

function parseSelectedFiltersParam(value: string | null): StoreSearchFilters {
  if (!value?.trim()) {
    return {}
  }

  try {
    const parsed = JSON.parse(value)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {}
    }

    const filters: StoreSearchFilters = {}
    for (const [key, values] of Object.entries(parsed)) {
      const safeValues = (Array.isArray(values) ? values : [values])
        .filter((item): item is string => typeof item === "string")
        .slice(0, 20)
      if (safeValues.length) {
        filters[key] = safeValues
      }
    }

    return Object.fromEntries(Object.entries(filters).slice(0, 20))
  } catch {
    return {}
  }
}

function parseSelectedTokenParam(value: string | string[] | null | undefined) {
  if (!value) {
    return []
  }

  const rawValues = Array.isArray(value)
    ? value.flatMap((item) => item.split(","))
    : value.split(",")

  return Array.from(
    new Set(
      rawValues
        .map((item) => item.trim())
        .filter((item) => item && item.length <= 255)
    )
  ).slice(0, MAX_SELECTED_FILTER_VALUES)
}

function toggleSelectedToken(values: string[], value: string) {
  const token = value.trim()
  if (!token || token.length > 255) {
    return values
  }
  if (values.includes(token)) {
    return values.filter((item) => item !== token)
  }
  return [...values, token]
}

function formatPriceFilterValue(value: number) {
  return `LKR ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)}`
}

function normalizePriceInput(value: string, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }
  return Math.min(Math.round(parsed), max)
}

function FilterLibraryIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-brand"
    >
      <path d="M4 6h10" />
      <path d="M18 6h2" />
      <path d="M4 12h2" />
      <path d="M10 12h10" />
      <path d="M4 18h8" />
      <path d="M16 18h4" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="14" cy="18" r="2" />
    </svg>
  )
}
