import Image from "next/image"

import type { FeaturedProductCard } from "@lib/data/featured-products"
import type { HomepageCmsItem, HomepageCmsSection } from "@lib/data/homepage"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type InformationColumnsSectionProps = {
  sections: HomepageCmsSection[]
}

const PLACEMENT = "homepage_information_columns"
const FALLBACK_IMAGES = [
  "/images/backgroundimagecolumn1informationsection.png",
  "/images/backgroundimagecolumn2informationsection.png",
] as const

const InformationColumnsSection = ({
  sections,
}: InformationColumnsSectionProps) => {
  const section = sections.find(isInformationColumnsSection)
  if (!section) {
    return null
  }

  const items = section.items
    .filter((item) => item.config?.placement === PLACEMENT)
    .slice()
    .sort((left, right) => left.sort_order - right.sort_order)
  const productOffers = items
    .filter(
      (item) =>
        item.reference_type === "product" &&
        item.config?.role === "product_offer" &&
        item.resolved
    )
    .map((item) => ({
      item,
      product: item.resolved as unknown as FeaturedProductCard,
    }))
    .slice(0, 2)

  if (productOffers.length !== 2) {
    return null
  }

  return (
    <section
      className="bg-white py-7 sm:py-8 md:py-9 small:py-10"
      aria-label="Homepage business solutions"
    >
      <div className="content-container">
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
          {productOffers.map(({ item, product }, index) => (
            <LocalizedClientLink
              key={item.id ?? item.reference_id ?? index}
              href={`/products/${product.handle}`}
              className="group relative min-h-[304px] overflow-hidden rounded-[10px] border border-[#191919] bg-black p-4 text-white shadow-sm transition-shadow hover:shadow-[0_12px_30px_rgba(0,0,0,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 xsmall:min-h-[324px] xsmall:p-5 md:min-h-[342px] md:p-6 small:p-7 large:min-h-[372px]"
            >
              <TileBackground
                src={imageUrl(item, index)}
                alt={item.media?.alt_text ?? item.media_alt_text ?? product.title}
                priority={index === 0}
              />
              <div className="relative z-10 flex h-full min-w-0 max-w-[280px] flex-col xsmall:max-w-[330px] md:w-[58%] md:max-w-[430px] large:w-[62%]">
                <p className="text-[13px] font-bold uppercase leading-5 tracking-normal text-brand sm:text-[14px] small:text-[16px] small:leading-6">
                  {stringConfig(item.config?.eyebrow) || "LIMITED TIME OFFER"}
                </p>
                <h2 className="mt-2 text-[26px] font-bold leading-[1.16] tracking-normal xsmall:text-[28px] sm:text-[30px] small:mt-3 small:text-[34px] small:leading-[1.18]">
                  {item.title}
                </h2>
                {item.subtitle && (
                  <p className="mt-3 line-clamp-3 text-[13px] leading-[1.45] text-white/90 small:mt-4 small:text-[14px]">
                    {item.subtitle}
                  </p>
                )}
                <div className="mt-auto pt-6 small:pt-8">
                  <p className="text-[14px] leading-5 text-white/90 small:text-[16px]">From</p>
                  <p className="mt-1.5 text-[28px] font-bold leading-none tracking-normal xsmall:text-[30px] small:mt-2 small:text-[34px]">
                    {formatProductPrice(product)}
                  </p>
                  <span className="mt-4 inline-flex h-10 items-center justify-center rounded-[5px] bg-brand px-5 text-[12px] font-bold text-white transition-colors group-hover:bg-[#e94f12] small:mt-5 small:h-11 small:px-6 small:text-[13px]">
                    {stringConfig(item.config?.cta_label) || "View product"}
                    <span className="ml-2" aria-hidden="true">
                      &gt;
                    </span>
                  </span>
                </div>
              </div>
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </section>
  )
}

function TileBackground({
  src,
  alt,
  priority = false,
}: {
  src: string
  alt: string
  priority?: boolean
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes="(min-width: 1280px) 50vw, (min-width: 1024px) 50vw, calc(100vw - 32px)"
      className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.015]"
    />
  )
}

function isInformationColumnsSection(section: HomepageCmsSection) {
  return (
    section.type === "category_grid" &&
    section.config?.placement === PLACEMENT
  )
}

function imageUrl(item: HomepageCmsItem, index: number) {
  return item.media?.url ?? item.media_url ?? FALLBACK_IMAGES[index]
}

function stringConfig(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : ""
}

function formatProductPrice(product: FeaturedProductCard) {
  if (
    product.price.status !== "available" ||
    product.price.calculated_amount === null
  ) {
    return "Contact for price"
  }
  return convertToLocale({
    amount: product.price.calculated_amount,
    currency_code: product.price.currency_code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export default InformationColumnsSection
