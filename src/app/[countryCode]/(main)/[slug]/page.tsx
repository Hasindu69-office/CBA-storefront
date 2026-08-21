import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { retrieveCmsPageContent } from "@lib/data/cms-pages"
import { isValidCmsSlug } from "@lib/util/cms-pages"
import DefaultCmsPageTemplate from "@modules/cms/templates/default-cms-page-template"

export const revalidate = 0

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params

  if (!isValidCmsSlug(slug)) {
    notFound()
  }

  const content = await retrieveCmsPageContent(slug)

  if (!content) {
    notFound()
  }

  return {
    title: content.page.seo.title,
    description: content.page.seo.description,
    alternates: content.page.seo.canonical_url
      ? { canonical: content.page.seo.canonical_url }
      : undefined,
    openGraph: {
      title: content.page.seo.title,
      description: content.page.seo.description,
    },
  }
}

export default async function CmsPage(props: Props) {
  const { slug } = await props.params

  if (!isValidCmsSlug(slug)) {
    notFound()
  }

  const content = await retrieveCmsPageContent(slug)

  if (!content) {
    notFound()
  }

  return <DefaultCmsPageTemplate content={content} />
}
