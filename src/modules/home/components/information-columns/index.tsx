import Image from "next/image"

import type { FeaturedProductCard } from "@lib/data/featured-products"
import type { HomepageCmsItem, HomepageCmsSection } from "@lib/data/homepage"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type InformationColumnsSectionProps = {
  sections: HomepageCmsSection[]
}

type ResolvedCategory = {
  id: string
  name: string
  handle: string
  description?: string | null
}

const PLACEMENT = "homepage_information_columns"
const FALLBACK_IMAGES = [
  "/images/backgroundimagecolumn1informationsection.png",
  "/images/backgroundimagecolumn2informationsection.png",
  "/images/backgroundimagecolumn3informationsection.png",
  "/images/backgroundimagecolumn4informationsection.png",
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
  const productItem = items.find(
    (item) => item.reference_type === "product" && item.config?.role === "product_offer"
  )
  const categoryItems = items
    .filter(
      (item) =>
        item.reference_type === "category" && item.config?.role === "category_card"
    )
    .slice(0, 3)

  const product = productItem?.resolved as unknown as FeaturedProductCard | undefined
  if (!productItem || !product || categoryItems.length !== 3) {
    return null
  }

  const categories = categoryItems
    .map((item) => ({
      item,
      categories: resolvedCategoriesForItem(item),
    }))
    .filter((entry) => entry.categories.length > 0)

  if (categories.length !== 3) {
    return null
  }

  return (
    <section
      className="bg-white py-7 sm:py-8 md:py-9 small:py-10"
      aria-label="Homepage business solutions"
    >
      <div className="content-container">
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 large:grid-cols-[2.12fr_repeat(3,minmax(0,1fr))]">
          <LocalizedClientLink
            href={`/products/${product.handle}`}
            className="group relative min-h-[304px] overflow-hidden rounded-[10px] border border-[#191919] bg-black p-4 text-white shadow-sm transition-shadow hover:shadow-[0_12px_30px_rgba(0,0,0,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 xsmall:min-h-[324px] xsmall:p-5 md:col-span-2 md:min-h-[342px] md:p-6 small:p-7 large:col-span-1 large:min-h-[372px]"
          >
            <TileBackground
              src={imageUrl(productItem, 0)}
              alt={productItem.media?.alt_text ?? productItem.media_alt_text ?? product.title}
              priority
            />
            <div className="relative z-10 flex h-full min-w-0 max-w-[280px] flex-col xsmall:max-w-[330px] md:w-[58%] md:max-w-[430px] large:w-[62%]">
              <p className="text-[13px] font-bold uppercase leading-5 tracking-normal text-brand sm:text-[14px] small:text-[16px] small:leading-6">
                {stringConfig(productItem.config?.eyebrow)}
              </p>
              <h2 className="mt-2 text-[26px] font-bold leading-[1.16] tracking-normal xsmall:text-[28px] sm:text-[30px] small:mt-3 small:text-[34px] small:leading-[1.18]">
                {productItem.title}
              </h2>
              {productItem.subtitle && (
                <p className="mt-3 line-clamp-3 text-[13px] leading-[1.45] text-white/90 small:mt-4 small:text-[14px]">
                  {productItem.subtitle}
                </p>
              )}
              <div className="mt-auto pt-6 small:pt-8">
                <p className="text-[14px] leading-5 text-white/90 small:text-[16px]">From</p>
                <p className="mt-1.5 text-[28px] font-bold leading-none tracking-normal xsmall:text-[30px] small:mt-2 small:text-[34px]">
                  {formatProductPrice(product)}
                </p>
                <span className="mt-4 inline-flex h-10 items-center justify-center rounded-[5px] bg-brand px-5 text-[12px] font-bold text-white transition-colors group-hover:bg-[#e94f12] small:mt-5 small:h-11 small:px-6 small:text-[13px]">
                  {stringConfig(productItem.config?.cta_label) || "View product"}
                  <span className="ml-2" aria-hidden="true">
                    &gt;
                  </span>
                </span>
              </div>
            </div>
          </LocalizedClientLink>

          {categories.map(({ item, categories: cardCategories }, index) => (
            <article
              key={item.reference_id ?? index}
              className={[
                "group relative min-h-[286px] overflow-hidden rounded-[10px] border border-[#d6d6d6] bg-white px-4 py-4 text-black transition-colors hover:border-brand/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 xsmall:min-h-[304px] xsmall:px-5 xsmall:py-5 md:min-h-[326px] small:min-h-[342px] large:min-h-[372px]",
                index === 2 ? "md:col-span-2 large:col-span-1" : "",
              ].join(" ")}
            >
              <TileBackground
                src={imageUrl(item, index + 1)}
                alt={
                  item.media?.alt_text ??
                  item.media_alt_text ??
                  item.title ??
                  cardCategories[0].name
                }
              />
              <div className="relative z-10 flex h-full min-w-0 max-w-[235px] flex-col md:max-w-[260px] large:max-w-[178px]">
                <div className="flex items-start gap-2">
                  <ComputerIcon />
                  <h3 className="line-clamp-2 text-[13px] font-bold uppercase leading-[17px] tracking-normal small:text-[13px]">
                    {item.title || cardCategories[0].name}
                  </h3>
                </div>
                <div className="mt-6 h-[52px] max-w-[215px] md:max-w-[230px] small:mt-8 large:max-w-[155px]">
                  {(item.subtitle || cardCategories[0].description) && (
                    <p className="line-clamp-3 text-[12px] leading-[16px] text-black">
                      {item.subtitle || cardCategories[0].description}
                    </p>
                  )}
                </div>
                <ul className="mt-4 grid max-w-[225px] gap-1.5 text-[12px] leading-[18px] text-black md:max-w-[240px] small:mt-5 large:max-w-[165px]">
                  {cardCategories.slice(0, 4).map((category) => (
                    <li key={category.id} className="flex min-w-0 gap-2">
                      <span className="mt-[0.45rem] h-1 w-1 flex-shrink-0 rounded-full bg-black" />
                      <LocalizedClientLink
                        href={`/categories/${category.handle}`}
                        className="line-clamp-1 min-w-0 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                      >
                        {category.name}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function ComputerIcon() {
  return (
    <span
      className="mt-[1px] inline-flex h-[16px] w-[22px] flex-shrink-0 items-center justify-center text-black"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 18"
        className="h-full w-full"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2.75 2.5h13.5v9.25H2.75z" />
        <path d="M8.5 14.75h4" />
        <path d="M10.5 11.75v3" />
        <path d="M19.6 2.2v4.4" />
        <path d="M17.4 4.4h4.4" />
        <path d="M18.2 7.9h3.1" />
      </svg>
    </span>
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
      sizes="(min-width: 1280px) 472px, (min-width: 1024px) 25vw, calc(100vw - 32px)"
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

function resolvedCategoriesForItem(item: HomepageCmsItem): ResolvedCategory[] {
  const categories = Array.isArray(item.resolved_categories)
    ? item.resolved_categories
    : item.resolved
      ? [item.resolved]
      : []
  return categories
    .map((category) => ({
      id: stringValue(category.id),
      name: stringValue(category.name) || stringValue(category.id),
      handle: stringValue(category.handle),
      description:
        typeof category.description === "string" ? category.description : null,
    }))
    .filter((category) => category.id && category.handle)
}

function stringConfig(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : ""
}

function stringValue(value: unknown) {
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
