"use client"

import type { MouseEvent } from "react"
import Image from "next/image"

import {
  buildStoreBrandQueryHref,
  buildStoreCategoryQueryHref,
} from "@lib/util/store-filter-navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export type ProductCardBrandCategoryBrand = {
  id: string
  name: string
  logo_url?: string | null
  logo_alt_text?: string | null
} | null

export type ProductCardBrandCategoryCategory = {
  id: string
  name: string
} | null

type ProductCardBrandCategoryProps = {
  brand: ProductCardBrandCategoryBrand
  category: ProductCardBrandCategoryCategory
  variant?: "raised" | "flat" | "featured"
}

const VARIANT_STYLES = {
  raised: {
    row: "flex min-h-[26px] items-center gap-2.5 overflow-hidden",
    logoBox: "relative block h-[24px] w-[72px] flex-shrink-0",
    logoSizes: "72px",
    brandName:
      "line-clamp-1 max-w-[72px] text-[11px] font-bold uppercase leading-4 text-black",
    category:
      "line-clamp-1 min-w-0 flex-1 text-[10px] leading-4 text-[#9ca3af]",
  },
  flat: {
    row: "flex min-h-[26px] items-center gap-2.5 overflow-hidden",
    logoBox:
      "relative block h-[22px] w-[66px] flex-shrink-0 medium:h-[24px] medium:w-[74px]",
    logoSizes: "(min-width: 1024px) 74px, 66px",
    brandName:
      "line-clamp-1 max-w-[66px] text-[10px] font-bold uppercase leading-4 text-black medium:max-w-[74px] medium:text-[11px]",
    category:
      "line-clamp-1 min-w-0 flex-1 text-[9px] leading-4 text-[#9ca3af] medium:text-[10px]",
  },
  featured: {
    row: "flex min-h-[28px] items-center gap-2.5 overflow-hidden",
    logoBox: "relative block h-[26px] w-[88px] flex-shrink-0",
    logoSizes: "88px",
    brandName:
      "line-clamp-1 max-w-[88px] text-[12px] font-bold uppercase leading-4 text-black",
    category:
      "line-clamp-1 min-w-0 flex-1 text-[11px] leading-4 text-[#9a9aa0]",
  },
} as const

const FOCUS_CLASS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"

function stopCardPropagation(event: MouseEvent<HTMLAnchorElement>) {
  event.stopPropagation()
}

const ProductCardBrandCategory = ({
  brand,
  category,
  variant = "raised",
}: ProductCardBrandCategoryProps) => {
  const styles = VARIANT_STYLES[variant]
  const brandHref = brand?.id ? buildStoreBrandQueryHref(brand.id) : null
  const categoryHref = category?.id
    ? buildStoreCategoryQueryHref(category.id)
    : null
  const hasBrand = Boolean(brand?.logo_url || brand?.name)
  const hasCategory = Boolean(category?.name)

  if (!hasBrand && !hasCategory) {
    return null
  }

  return (
    <div className={styles.row}>
      {brand?.logo_url ? (
        brandHref ? (
          <LocalizedClientLink
            href={brandHref}
            aria-label={`Browse ${brand.name} products`}
            onClick={stopCardPropagation}
            className={`${styles.logoBox} transition-opacity hover:opacity-80 ${FOCUS_CLASS}`}
          >
            <Image
              src={brand.logo_url}
              alt={brand.logo_alt_text || `${brand.name} logo`}
              fill
              sizes={styles.logoSizes}
              className="object-contain object-left"
            />
          </LocalizedClientLink>
        ) : (
          <span className={styles.logoBox}>
            <Image
              src={brand.logo_url}
              alt={brand.logo_alt_text || `${brand.name} logo`}
              fill
              sizes={styles.logoSizes}
              className="object-contain object-left"
            />
          </span>
        )
      ) : brand?.name ? (
        brandHref ? (
          <LocalizedClientLink
            href={brandHref}
            aria-label={`Browse ${brand.name} products`}
            onClick={stopCardPropagation}
            className={`${styles.brandName} transition-opacity hover:opacity-80 ${FOCUS_CLASS}`}
          >
            {brand.name}
          </LocalizedClientLink>
        ) : (
          <span className={styles.brandName}>{brand.name}</span>
        )
      ) : null}

      {brand?.name && category?.name && (
        <span className="h-4 w-px flex-shrink-0 bg-[#d4d4d8]" />
      )}

      {category?.name ? (
        categoryHref ? (
          <LocalizedClientLink
            href={categoryHref}
            aria-label={`Browse ${category.name} category`}
            onClick={stopCardPropagation}
            className={`${styles.category} transition-opacity hover:opacity-80 ${FOCUS_CLASS}`}
          >
            {category.name}
          </LocalizedClientLink>
        ) : (
          <span className={styles.category}>{category.name}</span>
        )
      ) : null}
    </div>
  )
}

export default ProductCardBrandCategory
