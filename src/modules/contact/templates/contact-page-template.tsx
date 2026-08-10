import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ContactForm from "@modules/contact/components/contact-form"
import type { ContactPageContent } from "@lib/data/contact"

type Props = {
  content: ContactPageContent
}

export default function ContactPageTemplate({ content }: Props) {
  const whatsappHref = content.whatsapp.enabled
    ? buildWhatsAppHref(
        content.whatsapp.phone,
        content.whatsapp.prefilled_message
      )
    : null

  return (
    <div className="bg-[#fafbfc]" data-testid="contact-page">
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
            <li className="font-semibold text-[#151922]">Contact</li>
          </ol>
        </nav>

        <header className="mb-10 max-w-3xl">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#ff5c0e]">
            {content.hero.eyebrow}
          </p>
          <h1 className="mt-3 text-[36px] font-bold leading-tight text-[#151922] small:text-[44px]">
            {content.hero.title || content.page.title}
          </h1>
          <p className="mt-4 text-[16px] leading-7 text-[#5d6470]">
            {content.hero.intro}
          </p>
        </header>

        <div className="grid gap-8 large:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <ContactForm
            title={content.form.title}
            helper={content.form.helper}
            successText={content.form.success_text}
          />

          <aside className="flex flex-col gap-6">
            <section className="rounded-[8px] border border-[#eeeeee] bg-white p-6">
              <h2 className="text-[18px] font-bold text-[#151922]">
                Contact details
              </h2>
              <dl className="mt-5 space-y-4 text-[14px]">
                <Detail
                  label={content.details.phone_label}
                  value={content.details.phone}
                  href={`tel:${content.details.phone.replace(/\s+/g, "")}`}
                />
                <Detail
                  label={content.details.email_label}
                  value={content.details.email}
                  href={`mailto:${content.details.email}`}
                />
                <Detail
                  label={content.details.address_label}
                  value={content.details.address}
                />
                <Detail
                  label={content.details.hours_label}
                  value={content.details.hours}
                />
              </dl>
            </section>

            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-[#25D366] bg-white px-5 py-3 text-[14px] font-semibold text-[#128C7E] transition hover:bg-[#f0fff6]"
              >
                {content.whatsapp.label}
              </a>
            )}

            <section className="rounded-[8px] border border-[#eeeeee] bg-white p-6">
              <h2 className="text-[18px] font-bold text-[#151922]">
                Quick help
              </h2>
              <ul className="mt-4 space-y-3">
                {content.support_links.map((link) => (
                  <li key={`${link.label}-${link.url}`}>
                    <LocalizedClientLink
                      href={link.url}
                      className="block rounded-md border border-transparent px-3 py-3 transition hover:border-[#eeeeee] hover:bg-[#fafbfc]"
                    >
                      <span className="block text-[14px] font-semibold text-[#151922]">
                        {link.label}
                      </span>
                      {link.description && (
                        <span className="mt-1 block text-[13px] text-[#5d6470]">
                          {link.description}
                        </span>
                      )}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </section>

            {content.map.enabled && (
              <section className="rounded-[8px] border border-[#eeeeee] bg-white p-6">
                <h2 className="text-[18px] font-bold text-[#151922]">
                  {content.map.label}
                </h2>
                <p className="mt-3 text-[14px] leading-6 text-[#5d6470]">
                  {content.map.address}
                </p>
              </section>
            )}

            {content.faq.length > 0 && (
              <section className="rounded-[8px] border border-[#eeeeee] bg-white p-6">
                <h2 className="text-[18px] font-bold text-[#151922]">FAQs</h2>
                <ul className="mt-4 space-y-4">
                  {content.faq.map((item) => (
                    <li key={item.question}>
                      <p className="text-[14px] font-semibold text-[#151922]">
                        {item.question}
                      </p>
                      <p className="mt-1 text-[13px] leading-6 text-[#5d6470]">
                        {item.answer}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}

function Detail({
  label,
  value,
  href,
}: {
  label: string
  value: string
  href?: string
}) {
  return (
    <div>
      <dt className="text-[12px] font-semibold uppercase tracking-wide text-[#8a919c]">
        {label}
      </dt>
      <dd className="mt-1 text-[#151922]">
        {href ? (
          <a href={href} className="transition hover:text-[#ff5c0e]">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}

function buildWhatsAppHref(phone: string, message: string) {
  const digits = phone.replace(/[^\d]/g, "")
  if (!digits) return null
  const text = encodeURIComponent(message)
  return `https://wa.me/${digits}${text ? `?text=${text}` : ""}`
}
