import type { CmsPageContent } from "@lib/data/cms-pages"
import type { HomepageCmsItem } from "@lib/data/homepage"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = {
  content: CmsPageContent
}

export default function DefaultCmsPageTemplate({ content }: Props) {
  if (content.page.template_key === "policy") {
    return <PolicyCmsPageTemplate content={content} />
  }

  if (content.page.template_key === "landing") {
    return <LandingCmsPageTemplate content={content} />
  }

  return <EditorialCmsPageTemplate content={content} />
}

function EditorialCmsPageTemplate({ content }: Props) {
  const richTextSections = content.sections.filter(
    (section) =>
      section.type === "content_rich_text" &&
      (section.title || section.items.length > 0)
  )

  return (
    <main className="bg-[#fafbfc] text-[#151922]" data-testid="cms-page">
      <div className="content-container py-8 small:py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-[#5d6470]">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <LocalizedClientLink
                href="/"
                className="transition hover:text-[#ff5c0e]"
              >
                Home
              </LocalizedClientLink>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-semibold text-[#151922]">
              {content.page.title}
            </li>
          </ol>
        </nav>

        <article className="mx-auto max-w-5xl">
          <header className="border-b border-[#eeeeee] pb-8">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#ff5c0e]">
              CBA
            </p>
            <h1 className="mt-3 text-[34px] font-bold leading-tight small:text-[44px]">
              {content.page.title}
            </h1>
            {content.page.excerpt && (
              <p className="mt-4 max-w-3xl text-[16px] leading-7 text-[#5d6470]">
                {content.page.excerpt}
              </p>
            )}
          </header>

          <div className="mt-8 rounded-[8px] border border-[#eeeeee] bg-white p-6 small:p-8">
            {content.page.body_html ? (
              <RichHtml html={content.page.body_html} />
            ) : (
              <p className="text-[15px] leading-7 text-[#5d6470]">
                Content is being prepared.
              </p>
            )}
          </div>

          {richTextSections.map((section) => (
            <section
              key={`${section.type}-${section.sort_order}-${section.title ?? ""}`}
              className="mt-6 rounded-[8px] border border-[#eeeeee] bg-white p-6 small:p-8"
            >
              {section.title && (
                <h2 className="text-[24px] font-bold leading-tight">
                  {section.title}
                </h2>
              )}
              <div className={section.title ? "mt-5 space-y-6" : "space-y-6"}>
                {section.items.map((item, index) => (
                  <RichTextItem
                    key={`${item.title ?? "item"}-${item.sort_order}-${index}`}
                    item={item}
                  />
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>
    </main>
  )
}

function PolicyCmsPageTemplate({ content }: Props) {
  const richTextSections = content.sections.filter(
    (section) =>
      section.type === "content_rich_text" &&
      (section.title || section.items.length > 0)
  )

  return (
    <main className="bg-[#fafbfc] text-[#151922]" data-testid="cms-page">
      <div className="content-container py-8 small:py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-[#5d6470]">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <LocalizedClientLink
                href="/"
                className="transition hover:text-[#ff5c0e]"
              >
                Home
              </LocalizedClientLink>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-semibold text-[#151922]">
              {content.page.title}
            </li>
          </ol>
        </nav>

        <div className="grid gap-8 large:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[8px] border border-[#eeeeee] bg-white p-5 large:sticky large:top-6">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#ff5c0e]">
              Information
            </p>
            <h1 className="mt-3 text-[24px] font-bold leading-tight">
              {content.page.title}
            </h1>
            {content.page.excerpt && (
              <p className="mt-3 text-[14px] leading-6 text-[#5d6470]">
                {content.page.excerpt}
              </p>
            )}
          </aside>

          <article className="rounded-[8px] border border-[#eeeeee] bg-white p-6 small:p-8">
            <header className="border-b border-[#eeeeee] pb-6">
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#ff5c0e]">
                CBA Policy
              </p>
              <h2 className="mt-3 text-[32px] font-bold leading-tight small:text-[40px]">
                {content.page.title}
              </h2>
            </header>

            <div className="mt-7">
              {content.page.body_html ? (
                <RichHtml html={content.page.body_html} />
              ) : (
                <p className="text-[15px] leading-7 text-[#5d6470]">
                  Content is being prepared.
                </p>
              )}
            </div>

            {richTextSections.map((section) => (
              <section
                key={`${section.type}-${section.sort_order}-${section.title ?? ""}`}
                className="mt-8 border-t border-[#eeeeee] pt-8"
              >
                {section.title && (
                  <h2 className="text-[22px] font-bold leading-tight">
                    {section.title}
                  </h2>
                )}
                <div className={section.title ? "mt-5 space-y-6" : "space-y-6"}>
                  {section.items.map((item, index) => (
                    <RichTextItem
                      key={`${item.title ?? "item"}-${item.sort_order}-${index}`}
                      item={item}
                    />
                  ))}
                </div>
              </section>
            ))}
          </article>
        </div>
      </div>
    </main>
  )
}

function LandingCmsPageTemplate({ content }: Props) {
  const richTextSections = content.sections.filter(
    (section) =>
      section.type === "content_rich_text" &&
      (section.title || section.items.length > 0)
  )

  return (
    <main className="bg-white text-[#151922]" data-testid="cms-page">
      <section className="border-b border-[#eeeeee] bg-[#151922] text-white">
        <div className="content-container py-10 small:py-14">
          <nav
            aria-label="Breadcrumb"
            className="mb-8 text-[13px] text-white/70"
          >
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <LocalizedClientLink
                  href="/"
                  className="transition hover:text-[#ff5c0e]"
                >
                  Home
                </LocalizedClientLink>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-semibold text-white">{content.page.title}</li>
            </ol>
          </nav>
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#ff5c0e]">
            CBA Ebiz
          </p>
          <h1 className="mt-4 max-w-4xl text-[38px] font-bold leading-tight small:text-[56px]">
            {content.page.title}
          </h1>
          {content.page.excerpt && (
            <p className="mt-5 max-w-3xl text-[17px] leading-8 text-white/78">
              {content.page.excerpt}
            </p>
          )}
        </div>
      </section>

      <div className="content-container py-10 small:py-14">
        <article className="mx-auto max-w-6xl">
          <div className="rounded-[8px] border border-[#eeeeee] bg-[#fafbfc] p-6 small:p-8">
            {content.page.body_html ? (
              <RichHtml html={content.page.body_html} />
            ) : (
              <p className="text-[15px] leading-7 text-[#5d6470]">
                Content is being prepared.
              </p>
            )}
          </div>

          {richTextSections.map((section) => (
            <section
              key={`${section.type}-${section.sort_order}-${section.title ?? ""}`}
              className="mt-8"
            >
              {section.title && (
                <h2 className="text-center text-[28px] font-bold leading-tight small:text-[36px]">
                  {section.title}
                </h2>
              )}
              <div className="mt-6 grid gap-5 medium:grid-cols-2">
                {section.items.map((item, index) => (
                  <div
                    key={`${item.title ?? "item"}-${item.sort_order}-${index}`}
                    className="rounded-[8px] border border-[#eeeeee] bg-white p-6"
                  >
                    <RichTextItem item={item} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>
    </main>
  )
}

function RichTextItem({ item }: { item: HomepageCmsItem }) {
  const href = item.url?.trim()

  return (
    <div className="border-t border-[#eeeeee] pt-6 first:border-t-0 first:pt-0">
      {item.media_url && (
        <img
          src={item.media_url}
          alt={item.media_alt_text || item.title || "CMS content image"}
          className="mb-5 h-auto max-h-[420px] w-full rounded-[8px] object-cover"
          loading="lazy"
        />
      )}
      {item.title && (
        <h3 className="text-[20px] font-bold leading-tight">{item.title}</h3>
      )}
      {item.subtitle && (
        <p className="mt-2 text-[15px] leading-7 text-[#5d6470]">
          {item.subtitle}
        </p>
      )}
      {item.body_html && (
        <div className="mt-4">
          <RichHtml html={item.body_html} />
        </div>
      )}
      {href && (
        <CmsItemLink href={href}>
          {typeof item.config?.cta_label === "string" && item.config.cta_label.trim()
            ? item.config.cta_label.trim()
            : "Learn more"}
        </CmsItemLink>
      )}
    </div>
  )
}

function RichHtml({ html }: { html: string }) {
  return (
    <div
      className="cms-rich-text text-[15px] leading-7 text-[#3f4652]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function CmsItemLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const className =
    "mt-5 inline-flex min-h-11 items-center rounded-md bg-[#151922] px-5 py-2 text-[14px] font-semibold text-white transition hover:bg-[#ff5c0e]"

  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} className={className} rel="noopener noreferrer">
        {children}
      </a>
    )
  }

  return (
    <LocalizedClientLink href={href} className={className}>
      {children}
    </LocalizedClientLink>
  )
}
