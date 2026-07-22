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
      className="bg-white py-8 small:py-10"
      aria-label="Homepage business solutions"
    >
      <div className="content-container">
        <div className="grid gap-4 large:grid-cols-[2.12fr_repeat(3,minmax(0,1fr))]">
          <LocalizedClientLink
            href={`/products/${product.handle}`}
            className="group relative min-h-[342px] overflow-hidden rounded-[10px] border border-[#191919] bg-black p-6 text-white shadow-sm transition-shadow hover:shadow-[0_12px_30px_rgba(0,0,0,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 small:p-7 large:min-h-[372px]"
          >
            <TileBackground
              src={imageUrl(productItem, 0)}
              alt={productItem.media?.alt_text ?? productItem.media_alt_text ?? product.title}
              priority
            />
            <div className="relative z-10 flex h-full w-[62%] min-w-[300px] max-w-[430px] flex-col">
              <p className="text-[16px] font-bold uppercase leading-6 tracking-normal text-brand">
                {stringConfig(productItem.config?.eyebrow)}
              </p>
              <h2 className="mt-3 text-[34px] font-bold leading-[1.18] tracking-normal">
                {productItem.title}
              </h2>
              {productItem.subtitle && (
                <p className="mt-4 text-[14px] leading-[1.45] text-white/90">
                  {productItem.subtitle}
                </p>
              )}
              <div className="mt-auto pt-8">
                <p className="text-[16px] leading-5 text-white/90">From</p>
                <p className="mt-2 text-[34px] font-bold leading-none tracking-normal">
                  {formatProductPrice(product)}
                </p>
                <span className="mt-5 inline-flex h-11 items-center justify-center rounded-[5px] bg-brand px-6 text-[13px] font-bold text-white transition-colors group-hover:bg-[#e94f12]">
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
              className="group relative min-h-[342px] overflow-hidden rounded-[10px] border border-[#d6d6d6] bg-white px-5 py-5 text-black transition-colors hover:border-brand/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 large:min-h-[372px]"
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
              <div className="relative z-10 flex h-full max-w-[178px] flex-col">
                <div className="flex items-start gap-2">
                  <ComputerIcon />
                  <h3 className="line-clamp-2 text-[13px] font-bold uppercase leading-[17px] tracking-normal">
                    {item.title || cardCategories[0].name}
                  </h3>
                </div>
                <div className="mt-8 h-[52px] max-w-[155px]">
                  {(item.subtitle || cardCategories[0].description) && (
                    <p className="line-clamp-3 text-[12px] leading-[16px] text-black">
                      {item.subtitle || cardCategories[0].description}
                    </p>
                  )}
                </div>
                <ul className="mt-5 grid max-w-[165px] gap-1.5 text-[12px] leading-[18px] text-black">
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
