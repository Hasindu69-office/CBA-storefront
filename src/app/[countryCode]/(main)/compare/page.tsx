import { Metadata } from "next"

import { getComparePageData } from "@lib/data/compare"
import CompareTemplate from "@modules/compare/templates"

export const metadata: Metadata = {
  title: "Compare Products | Ebiz",
  description: "Compare products by price, stock, and specifications.",
}

export const revalidate = 0

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ ids?: string | string[] }>
}

export default async function ComparePage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams
  const data = await getComparePageData({
    ids: searchParams.ids,
    countryCode: params.countryCode,
  })

  return (
    <CompareTemplate
      countryCode={params.countryCode}
      data={data}
      initialIds={data.requestedIds}
    />
  )
}
