import { listBestSellingProductCards } from "@lib/data/best-selling-products"
import type { HomepageCmsSection } from "@lib/data/homepage"
import BestSellingProductsCarousel from "./best-selling-products-carousel"

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
          <div className="relative left-1/2 aspect-[326.5/569.13] w-screen max-w-[100vw] -translate-x-1/2 small:left-auto small:mx-auto small:aspect-[1728/830] small:w-full small:max-w-[1362px] small:translate-x-0">
            <MaskedBackground
              className="small:hidden"
              maskImage="/images/Asset 2.svg"
              backgroundPosition="center"
            />
            <MaskedBackground
              className="hidden small:block"
              maskImage="/images/svgviewer-output.svg"
              backgroundPosition="center"
            />

            <div className="pointer-events-none absolute left-1/2 top-[-10px] z-30 flex h-[92px] w-[min(330px,78%)] -translate-x-1/2 flex-col items-center justify-center px-4 pb-6 text-center xsmall:top-[-8px] xsmall:h-[104px] xsmall:pb-7 small:top-[-12px] small:h-[104px] small:w-[min(620px,48%)] small:pb-2">
              <h2
                id="best-selling-products-title"
                className="text-[22px] font-bold leading-[1.12] tracking-normal text-black xsmall:text-[26px] small:text-[34px]"
              >
                {title}
              </h2>
              <p className="mt-2 max-w-[620px] text-[13px] leading-5 tracking-normal text-black xsmall:text-[14px] small:text-[16px]">
                {description}
              </p>
            </div>

            <div className="absolute inset-x-0 top-[156px] z-20 px-6 xsmall:top-[172px] xsmall:px-7 small:top-[134px] small:px-10 medium:px-7 large:px-9">
              <BestSellingProductsCarousel products={products} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function MaskedBackground({
  className,
  maskImage,
  backgroundPosition,
}: {
  className: string
  maskImage: string
  backgroundPosition: string
}) {
  return (
    <div
      className={`absolute inset-0 z-10 overflow-hidden bg-[#111820] ${className}`}
      style={{
        WebkitMaskImage: `url("${maskImage}")`,
        maskImage: `url("${maskImage}")`,
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
          backgroundPosition,
        }}
      />
    </div>
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
