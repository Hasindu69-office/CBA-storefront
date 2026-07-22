import Image from "next/image"
import type { CSSProperties } from "react"

import { listHomepageBrands } from "@lib/data/brands"
import type { StorefrontBrand } from "@lib/data/brands"
import type { HomepageCmsSection } from "@lib/data/homepage"

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
    <section className="bg-white pb-8 pt-2 small:pb-10" aria-label="Featured brands">
      <div className="content-container">
        <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[4px] border border-[#e2e2e2] bg-white px-4 py-5 small:px-8">
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
                className="brand-slider-group flex min-w-max items-center gap-8 small:gap-12 medium:gap-16"
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
    <div
      aria-hidden={hiddenFromA11y}
      className="flex h-10 w-[112px] flex-shrink-0 items-center justify-center small:w-[132px]"
    >
      <Image
        src={brand.logo_url ?? ""}
        alt={hiddenFromA11y ? "" : brand.logo_alt_text || `${brand.name} logo`}
        width={132}
        height={40}
        priority={priority}
        sizes="132px"
        className="max-h-10 w-auto max-w-[132px] object-contain"
      />
    </div>
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
