"use client"

import Image from "next/image"
import { useMemo, useState } from "react"

import type { StorefrontBrand } from "@lib/data/brands"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { SearchIcon, StoreIcon, XIcon } from "@modules/layout/components/cba-icons"

type BrandDirectoryProps = {
  brands: StorefrontBrand[]
}

const MAX_SEARCH_LENGTH = 80

export default function BrandDirectory({ brands }: BrandDirectoryProps) {
  const [searchValue, setSearchValue] = useState("")
  const [validationMessage, setValidationMessage] = useState("")
  const query = searchValue.trim().toLowerCase()

  const filteredBrands = useMemo(() => {
    if (!query) {
      return brands
    }

    return brands.filter((brand) =>
      [brand.name, brand.slug, brand.description]
        .filter((value): value is string => typeof value === "string")
        .some((value) => value.toLowerCase().includes(query))
    )
  }, [brands, query])

  function updateSearch(value: string) {
    if (value.length > MAX_SEARCH_LENGTH) {
      setValidationMessage(
        `Search can be ${MAX_SEARCH_LENGTH} characters or fewer.`
      )
      setSearchValue(value.slice(0, MAX_SEARCH_LENGTH))
      return
    }

    setValidationMessage("")
    setSearchValue(value)
  }

  return (
    <section className="bg-white pb-16 pt-8 small:pb-20 small:pt-10">
      <div className="content-container">
        <div className="flex justify-end border-b border-[#eeeeee] pb-6">
          <div className="w-full small:w-[360px]">
            <label htmlFor="brand-search" className="sr-only">
              Search brands
            </label>
            <div className="relative">
              <SearchIcon
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8a92]"
                aria-hidden="true"
              />
              <input
                id="brand-search"
                type="search"
                value={searchValue}
                maxLength={MAX_SEARCH_LENGTH}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Search brands"
                className="h-12 w-full rounded-[8px] border border-[#e5e7eb] bg-white pl-10 pr-11 text-[14px] font-medium leading-5 text-[#25252b] outline-none transition-colors placeholder:text-[#a1a1aa] focus:border-brand focus:ring-2 focus:ring-brand/20"
                aria-describedby={
                  validationMessage ? "brand-search-message" : undefined
                }
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => updateSearch("")}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[6px] text-[#6f6f76] transition-colors hover:bg-[#f5f5f6] hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  aria-label="Clear brand search"
                >
                  <XIcon size={16} />
                </button>
              )}
            </div>
            {validationMessage && (
              <p
                id="brand-search-message"
                className="mt-2 text-[12px] font-medium leading-5 text-brand"
              >
                {validationMessage}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 text-[13px] font-medium leading-5 text-[#777780]">
          <p>
            <span className="font-bold text-black">{filteredBrands.length}</span>{" "}
            {filteredBrands.length === 1 ? "brand" : "brands"} shown
          </p>
          {query && (
            <button
              type="button"
              onClick={() => updateSearch("")}
              className="font-bold text-brand transition-colors hover:text-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              Reset search
            </button>
          )}
        </div>

        {filteredBrands.length ? (
          <ul className="mt-6 grid grid-cols-1 gap-3 2xsmall:grid-cols-2 xsmall:gap-4 small:grid-cols-3 medium:grid-cols-4 large:grid-cols-5">
            {filteredBrands.map((brand) => (
              <li key={brand.id} className="min-w-0">
                <BrandCard brand={brand} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-6 rounded-[8px] border border-dashed border-[#d8d8de] bg-[#fbfbfb] px-5 py-12 text-center">
            <p className="text-[18px] font-bold leading-6 text-black">
              No brands found
            </p>
            <p className="mx-auto mt-2 max-w-[380px] text-[14px] leading-6 text-[#6f6f76]">
              Try a shorter brand name or clear the search to view the full
              directory.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function BrandCard({ brand }: { brand: StorefrontBrand }) {
  return (
    <LocalizedClientLink
      href={`/store?brand=${encodeURIComponent(brand.id)}`}
      className="group flex h-full min-h-[188px] flex-col rounded-[8px] border border-[#e5e7eb] bg-white p-3 shadow-[0_10px_26px_rgba(17,24,39,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(17,24,39,0.10)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 xsmall:min-h-[202px] xsmall:p-4 small:min-h-[214px]"
      aria-label={`Browse ${brand.name} products`}
    >
      <div className="flex h-[86px] items-center justify-center rounded-[8px] bg-white px-2 py-3 xsmall:h-[96px] xsmall:p-4 small:h-[104px]">
        {brand.logo_url ? (
          <Image
            src={brand.logo_url}
            alt={brand.logo_alt_text || `${brand.name} logo`}
            width={180}
            height={80}
            sizes="(min-width: 1440px) 180px, (min-width: 1024px) 16vw, 40vw"
            className="max-h-[62px] w-auto max-w-full object-contain xsmall:max-h-[68px] small:max-h-[72px]"
          />
        ) : (
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-[20px] font-bold uppercase leading-none text-brand xsmall:h-16 xsmall:w-16 xsmall:text-[22px]"
            aria-hidden="true"
          >
            {brandInitials(brand.name)}
          </span>
        )}
      </div>

      <div className="mt-3 min-w-0 flex-1 xsmall:mt-4">
        <h3 className="line-clamp-2 text-center text-[14px] font-bold leading-5 tracking-normal text-black xsmall:text-left xsmall:text-[15px]">
          {brand.name}
        </h3>
        {brand.description && (
          <p className="mt-1.5 line-clamp-2 text-center text-[11px] leading-5 text-[#777780] xsmall:mt-2 xsmall:text-left xsmall:text-[12px]">
            {brand.description}
          </p>
        )}
      </div>

      <span className="mt-3 inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-[6px] bg-[#111820] px-2 text-[11px] font-bold leading-none text-white xsmall:mt-4 xsmall:gap-2 xsmall:px-3 xsmall:text-[12px]">
        <StoreIcon size={14} aria-hidden="true" className="shrink-0" />
        <span className="truncate whitespace-nowrap">Browse products</span>
      </span>
    </LocalizedClientLink>
  )
}

function brandInitials(name: string) {
  const letters = name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")

  return letters || "CB"
}
