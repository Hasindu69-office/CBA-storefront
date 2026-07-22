import Image from "next/image"

import type { HomepageCmsItem, HomepageCmsSection } from "@lib/data/homepage"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type CategoryShowcaseProps = {
  sections: HomepageCmsSection[]
}

type ResolvedCategory = {
  id: string
  name: string
  handle: string
  description?: string | null
  image_url?: string | null
  image_alt?: string | null
}

const PLACEMENT = "homepage_category_showcase"
const FALLBACK_HERO_IMAGES = [
  "/images/categories/POS Terminals.png",
  "/images/categories/Printer & MRPs.png",
  "/images/categories/Projectors.png",
] as const

const CategoryShowcase = ({ sections }: CategoryShowcaseProps) => {
  const section = sections.find(isCategoryShowcaseSection)
  if (!section) {
    return null
  }

  const items = section.items
    .filter(
      (item) =>
        item.reference_type === "category" &&
        item.config?.placement === PLACEMENT
    )
    .slice()
    .sort((left, right) => left.sort_order - right.sort_order)
    .slice(0, 3)

  if (items.length !== 3) {
    return null
  }

  const cards = items
    .map((item, index) => {
      const categories = resolvedCategoriesForItem(item)
      const primaryCategory = primaryCategoryForItem(item, categories)
      const heroTitle = stringValue(item.config?.hero_title)
      const heroDescription =
        stringValue(item.config?.hero_description) || stringValue(item.subtitle)
      const heroTextAlign = heroTextAlignConfig(item.config?.hero_text_align, index)
      const heroTextColor = heroTextColorConfig(item.config?.hero_text_color, index)
      const viewAllHref =
        safeStorefrontPath(item.config?.view_all_url) ||
        (primaryCategory ? `/categories/${primaryCategory.handle}` : "")

      return {
        item,
        index,
        categories,
        primaryCategory,
        heroTitle,
        heroDescription,
        heroTextAlign,
        heroTextColor,
        viewAllHref,
      }
    })
    .filter(
      (card) =>
        card.item.title &&
        card.primaryCategory &&
        card.heroTitle &&
        card.viewAllHref &&
        card.categories.length > 0
    )

  if (cards.length !== 3) {
    return null
  }

  return (
    <section
      className="bg-white py-8 small:py-10"
      aria-label="Homepage category showcase"
    >
      <div className="content-container">
        <div className="grid gap-2 large:grid-cols-3">
          {cards.map(
            ({
              item,
              index,
              categories,
              primaryCategory,
              heroTitle,
              heroDescription,
              heroTextAlign,
              heroTextColor,
              viewAllHref,
            }) => (
              <article
                key={item.id ?? item.reference_id ?? index}
                className="overflow-hidden rounded-[8px] border border-[#d8d8de] bg-white px-7 py-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="line-clamp-2 text-[18px] font-bold uppercase leading-6 tracking-normal text-black">
                    {item.title}
                  </h2>
                  {primaryCategory && (
                    <LocalizedClientLink
                      href={viewAllHref}
                      className="mt-1 flex-shrink-0 text-[13px] leading-5 text-[#666666] transition-colors hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                    >
                      {stringValue(item.config?.view_all_label) || "View All"}
                    </LocalizedClientLink>
                  )}
                </div>

                <LocalizedClientLink
                  href={viewAllHref}
                  className="group relative mt-7 block h-[174px] overflow-hidden rounded-[8px] bg-[#f2f2f2] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  <Image
                    src={heroImageUrl(item, index)}
                    alt={
                      item.media?.alt_text ??
                      item.media_alt_text ??
                      heroTitle
                    }
                    fill
                    priority={index < 3}
                    sizes="(min-width: 1280px) 338px, (min-width: 1024px) 30vw, calc(100vw - 88px)"
                    className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.015]"
                  />
                  <div
                    className={[
                      "relative z-10 flex h-full max-w-[58%] flex-col justify-center px-7 py-5",
                      heroTextBlockClass(heroTextAlign),
                      heroTextColorClass(heroTextColor),
                    ].join(" ")}
                  >
                    <h3 className="line-clamp-2 text-[15px] font-bold leading-5 tracking-normal">
                      {heroTitle}
                    </h3>
                    {heroDescription && (
                      <p className="mt-2 line-clamp-2 text-[12px] font-semibold leading-4 tracking-normal opacity-80">
                        {heroDescription}
                      </p>
                    )}
                  </div>
                </LocalizedClientLink>

                <div className="my-7 h-px bg-[#d9d9d9]" />

                <div className="grid grid-cols-2 gap-x-9 gap-y-8">
                  {categories.slice(0, 4).map((category) => (
                    <LocalizedClientLink
                      key={category.id}
                      href={`/categories/${category.handle}`}
                      className="group grid min-w-0 justify-items-center text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                    >
                      <div className="relative flex h-[110px] w-[110px] items-center justify-center overflow-hidden rounded-full bg-[#f3f3f5] small:h-[118px] small:w-[118px]">
                        {category.image_url ? (
                          <Image
                            src={category.image_url}
                            alt={category.image_alt || category.name}
                            fill
                            sizes="118px"
                            className="object-contain object-center p-4 transition-transform duration-300 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <span className="px-4 text-[28px] font-bold uppercase leading-none text-[#b8bac3]">
                            {categoryInitials(category.name)}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-4 line-clamp-2 min-h-[40px] text-[14px] font-bold leading-5 tracking-normal text-black transition-colors group-hover:text-brand">
                        {category.name}
                      </h3>
                    </LocalizedClientLink>
                  ))}
                </div>
              </article>
            )
          )}
        </div>
      </div>
    </section>
  )
}

function isCategoryShowcaseSection(section: HomepageCmsSection) {
  return (
    section.type === "category_grid" &&
    section.config?.placement === PLACEMENT
  )
}

function heroImageUrl(item: HomepageCmsItem, index: number) {
  return item.media?.url ?? item.media_url ?? FALLBACK_HERO_IMAGES[index]
}

function primaryCategoryForItem(
  item: HomepageCmsItem,
  categories: ResolvedCategory[]
) {
  return (
    categories.find((category) => category.id === item.reference_id) ??
    categories[0] ??
    null
  )
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
      image_url:
        typeof category.image_url === "string" ? category.image_url : null,
      image_alt:
        typeof category.image_alt === "string" ? category.image_alt : null,
    }))
    .filter((category) => category.id && category.handle)
}

function categoryInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
}

function safeStorefrontPath(value: unknown) {
  const path = stringValue(value)
  return path && path.startsWith("/") && !path.startsWith("//") && !path.includes("\\")
    ? path
    : ""
}

function heroTextAlignConfig(value: unknown, index: number) {
  if (value === "left" || value === "center" || value === "right") {
    return value
  }
  return index === 2 ? "center" : "left"
}

function heroTextColorConfig(value: unknown, index: number) {
  if (value === "black" || value === "white") {
    return value
  }
  return index === 1 ? "black" : "white"
}

function heroTextBlockClass(align: "left" | "center" | "right") {
  if (align === "center") {
    return "mx-auto max-w-[72%] -translate-y-5 text-center"
  }
  if (align === "right") {
    return "ml-auto -translate-y-5 text-right"
  }
  return "mr-auto -translate-y-5 text-left"
}

function heroTextColorClass(color: "black" | "white") {
  return color === "white" ? "text-white" : "text-black"
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : ""
}

export default CategoryShowcase
