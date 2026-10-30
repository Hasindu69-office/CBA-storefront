import { listBestSellingProductCards } from "@lib/data/best-selling-products"
import type { KokoCheckoutBranding } from "@lib/data/koko-branding"
import type { HomepageCmsSection } from "@lib/data/homepage"
import BestSellingProductsCarousel from "./best-selling-products-carousel"

type BestSellingProductsSectionProps = {
  sections: HomepageCmsSection[]
  kokoBranding?: KokoCheckoutBranding | null
  kokoAvailable?: boolean
}

const BEST_SELLING_PLACEMENT = "homepage_best_selling_products"
const BACKGROUND_FALLBACK_URL = "/images/bestsellingbackground.png"
const FALLBACK_TITLE = "Best Selling Products"
const FALLBACK_DESCRIPTION =
  "Most Popular products chosen by business like you."

const BestSellingProductsSection = async ({
  sections,
  kokoBranding,
  kokoAvailable = false,
}: BestSellingProductsSectionProps) => {
  const section = sections.find(isBestSellingSection)
  if (!section) {
    return null
  }

  const sourceType = sourceTypeConfig(section.config?.source_type)
  const sourceId = stringConfig(section.config?.source_id) ||
    stringConfig(section.config?.category_id)
  if (!sourceId) {
    return null
  }

  const products = await listBestSellingProductCards({
    sourceType,
    sourceId,
    limit: 5,
  }).catch(() => [])

  if (!products.length) {
    return null
  }

  const title = section.title?.trim() || FALLBACK_TITLE
  const description =
    stringConfig(section.config?.description) || FALLBACK_DESCRIPTION
  const backgroundImageUrl = safeBackgroundImageUrl(
    section.config?.background_image_url
  )

  return (
    <section
      className="bg-white py-10 small:py-14"
      aria-labelledby="best-selling-products-title"
    >
      <div className="content-container">
        <div
          className="relative isolate overflow-hidden rounded-2xl bg-[#111820] bg-cover bg-center py-8 xsmall:py-10 small:py-12"
          style={{ backgroundImage: `url("${backgroundImageUrl}")` }}
        >
          <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-black/55 via-black/30 to-black/45" />

          <div className="relative z-10 px-4 xsmall:px-6 small:px-8 large:px-10">
            <div className="mx-auto max-w-[720px] text-center text-white">
              <h2
                id="best-selling-products-title"
                className="font-heading text-[24px] font-bold leading-tight tracking-normal xsmall:text-[28px] small:text-[34px]"
              >
                {title}
              </h2>
              <p className="mx-auto mt-2 max-w-[620px] text-[13px] leading-5 tracking-normal text-white/85 xsmall:text-[14px] small:text-[16px] small:leading-6">
                {description}
              </p>
            </div>

            <div className="mt-8 xsmall:mt-10 small:mt-12">
              <BestSellingProductsCarousel
                products={products}
                kokoBranding={kokoBranding}
                kokoAvailable={kokoAvailable}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function safeBackgroundImageUrl(value: unknown) {
  if (typeof value !== "string") {
    return BACKGROUND_FALLBACK_URL
  }

  const url = value.trim()
  if (
    !url ||
    url.startsWith("//") ||
    url.includes("\\") ||
    url.includes("..") ||
    /[\u0000-\u001F\u007F]/.test(url)
  ) {
    return BACKGROUND_FALLBACK_URL
  }
  if (url.startsWith("/")) {
    return url
  }

  try {
    const parsed = new URL(url)
    if (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      !parsed.username &&
      !parsed.password
    ) {
      return url
    }
  } catch {
    return BACKGROUND_FALLBACK_URL
  }
  return BACKGROUND_FALLBACK_URL
}

function isBestSellingSection(section: HomepageCmsSection) {
  return (
    section.type === "product_tabs" &&
    section.config?.placement === BEST_SELLING_PLACEMENT
  )
}

function stringConfig(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : ""
}

function sourceTypeConfig(value: unknown): "category" | "brand" | "badge" {
  if (value === "brand" || value === "badge" || value === "category") {
    return value
  }
  return "category"
}

export default BestSellingProductsSection
