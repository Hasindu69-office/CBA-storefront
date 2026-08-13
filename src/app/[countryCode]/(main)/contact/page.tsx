import { Metadata } from "next"

import { retrieveContactPageContent } from "@lib/data/contact"
import ContactPageTemplate from "@modules/contact/templates/contact-page-template"

export async function generateMetadata(): Promise<Metadata> {
  const content = await retrieveContactPageContent()
  return {
    title: content.page.seo.title,
    description: content.page.seo.description,
  }
}

export default async function ContactPage() {
  const content = await retrieveContactPageContent()
  return <ContactPageTemplate content={content} />
}
