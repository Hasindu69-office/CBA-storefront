import { Metadata } from "next"

import BrandsTemplate from "@modules/brands/templates"

export const metadata: Metadata = {
  title: "Brands",
  description: "Browse every active brand available from CBA ebiz.",
}

export default async function BrandsPage() {
  return <BrandsTemplate />
}
