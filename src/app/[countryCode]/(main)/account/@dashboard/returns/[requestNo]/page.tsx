import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getReturnIntakeRequest } from "@lib/data/return-intake"
import ReturnIntakeDetailTemplate from "@modules/return-intake/templates/return-intake-detail-template"

type Props = {
  params: Promise<{ requestNo: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  return { title: `Request ${params.requestNo}` }
}

export default async function ReturnIntakeDetailPage(props: Props) {
  const params = await props.params
  let result
  try {
    result = await getReturnIntakeRequest(params.requestNo)
  } catch {
    notFound()
  }

  return <ReturnIntakeDetailTemplate initialRequest={result.request} />
}
