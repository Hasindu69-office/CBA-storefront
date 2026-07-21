import { listBestSellingProductCards } from "@lib/data/best-selling-products"
import type { HomepageCmsSection } from "@lib/data/homepage"
import BestSellingProductCard from "./best-selling-product-card"

type BestSellingProductsSectionProps = {
  sections: HomepageCmsSection[]
}

const BEST_SELLING_PLACEMENT = "homepage_best_selling_products"
const FALLBACK_TITLE = "Best Selling Products"
const FALLBACK_DESCRIPTION =
  "Most Popular products chosen by business like you."

const BestSellingProductsSection = async ({
  sections,
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

  return (
    <section
      className="bg-white py-10 small:py-14"
      aria-labelledby="best-selling-products-title"
    >
      <div className="content-container">
        <div className="relative isolate overflow-visible">
          <div className="relative mx-auto aspect-[1728/830] w-full max-w-[1362px]">
          <div
            className="absolute inset-0 z-10 overflow-hidden bg-[#111820]"
            style={{
              WebkitMaskImage: 'url("/images/svgviewer-output.svg")',
              maskImage: 'url("/images/svgviewer-output.svg")',
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center top",
              maskPosition: "center top",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'url("/images/bestsellingbackground.png")',
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </div>

          <div className="pointer-events-none absolute left-1/2 top-[-10px] z-30 flex h-[88px] w-[min(560px,72%)] -translate-x-1/2 flex-col items-center justify-center px-4 pb-2 text-center small:top-[-12px] small:h-[104px] small:w-[min(620px,48%)]">
          <h2
            id="best-selling-products-title"
            className="text-[24px] font-bold leading-[1.12] tracking-normal text-black small:text-[34px]"
          >
            {title}
          </h2>
          <p className="mt-2 max-w-[620px] text-[14px] leading-5 tracking-normal text-black small:text-[16px]">
            {description}
          </p>
          </div>

          <div className="absolute inset-x-0 top-[112px] z-20 px-7 small:top-[134px] small:px-10 medium:px-7 large:px-9">
            <div className="no-scrollbar flex snap-x snap-mandatory justify-start gap-5 overflow-x-auto scroll-smooth pb-5 pl-0 pr-2 small:gap-6 medium:grid medium:grid-cols-5 medium:justify-items-center medium:gap-5 medium:overflow-visible medium:pb-0 medium:pr-0 large:gap-7">
              {products.slice(0, 5).map((product, index) => (
                <BestSellingProductCard
                  key={product.id}
                  product={product}
                  priority={index < 5}
                />
              ))}
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  )
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
