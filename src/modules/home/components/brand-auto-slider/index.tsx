import Image from "next/image"
import type { CSSProperties } from "react"

import { listHomepageBrands } from "@lib/data/brands"
import type { StorefrontBrand } from "@lib/data/brands"
import type { HomepageCmsSection } from "@lib/data/homepage"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type BrandAutoSliderProps = {
  sections: HomepageCmsSection[]
}

const PLACEMENT = "homepage_brand_strip"
const DEFAULT_LIMIT = 12
const DEFAULT_SPEED_SECONDS = 24
const LOOP_COPIES = 4

const BrandAutoSlider = async ({ sections }: BrandAutoSliderProps) => {
  const section = sections.find(isBrandStripSection)
  if (!section) {
    return null
  }

  const limit = numberConfig(section.config?.limit, DEFAULT_LIMIT, 1, 24)
  const autoplay = booleanConfig(section.config?.autoplay, true)
  const speedSeconds = numberConfig(
    section.config?.speed_seconds,
    DEFAULT_SPEED_SECONDS,
    12,
    60
  )

  const brands = await listHomepageBrands({ limit }).catch(() => [])
  if (!brands.length) {
    return null
  }

  const shouldLoop = autoplay && brands.length > 1
  const displayGroups = shouldLoop
    ? Array.from({ length: LOOP_COPIES }, () => brands)
    : [brands]

  return (
    <section className="bg-white pb-6 pt-1.5 sm:pb-7 md:pb-8 small:pb-10 small:pt-2" aria-label="Featured brands">
      <div className="mx-auto w-[92%] small:w-[90%]">
        <div className="w-full overflow-hidden bg-white px-3 py-4 sm:px-4 sm:py-[18px] md:px-5 md:py-5 small:px-8">
          <div
            className={[
              "brand-slider-track flex items-center",
              shouldLoop ? "brand-slider-track--animated" : "justify-center",
            ].join(" ")}
            style={
              shouldLoop
                ? ({
                    "--brand-slider-duration": `${speedSeconds}s`,
                  } as CSSProperties)
                : undefined
            }
          >
            {displayGroups.map((group, groupIndex) => (
              <div
                key={groupIndex}
                className="brand-slider-group flex min-w-max items-center gap-6 sm:gap-7 md:gap-10 small:gap-12 medium:gap-16"
              >
                {group.map((brand, brandIndex) => (
                  <BrandLogoLink
                    key={`${brand.id}-${groupIndex}-${brandIndex}`}
                    brand={brand}
                    priority={groupIndex === 0}
                    hiddenFromA11y={groupIndex > 0}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function BrandLogoLink({
  brand,
  priority,
  hiddenFromA11y,
}: {
  brand: StorefrontBrand
  priority: boolean
  hiddenFromA11y: boolean
}) {
  return (
    <LocalizedClientLink
      href={`/store?brand=${encodeURIComponent(brand.id)}`}
      aria-hidden={hiddenFromA11y}
      aria-label={hiddenFromA11y ? undefined : `Browse ${brand.name} products`}
      tabIndex={hiddenFromA11y ? -1 : undefined}
      className="flex h-11 w-[116px] flex-shrink-0 items-center justify-center transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:w-[126px] md:h-12 md:w-[142px] small:w-[158px]"
    >
      <Image
        src={brand.logo_url ?? ""}
        alt={hiddenFromA11y ? "" : brand.logo_alt_text || `${brand.name} logo`}
        width={158}
        height={48}
        priority={priority}
        sizes="(min-width: 1024px) 158px, (min-width: 768px) 142px, 126px"
        className="max-h-11 w-auto max-w-[116px] object-contain sm:max-w-[126px] md:max-h-12 md:max-w-[142px] small:max-w-[158px]"
      />
    </LocalizedClientLink>
  )
}

function isBrandStripSection(section: HomepageCmsSection) {
  return section.type === "brand_strip" && section.config?.placement === PLACEMENT
}

function numberConfig(
  value: unknown,
  fallback: number,
  min: number,
  max: number
) {
  const parsed = Number(value ?? fallback)
  return Number.isInteger(parsed) && parsed >= min && parsed <= max
    ? parsed
    : fallback
}

function booleanConfig(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback
}

export default BrandAutoSlider
