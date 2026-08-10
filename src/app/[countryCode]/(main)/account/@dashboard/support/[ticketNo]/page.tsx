import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSupportTicket } from "@lib/data/support"
import SupportTicketDetail from "@modules/support/components/support-ticket-detail"

type Props = {
  params: Promise<{ ticketNo: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  return { title: `Ticket ${params.ticketNo}` }
}

export default async function AccountSupportDetailPage(props: Props) {
  const params = await props.params
  let result
  try {
    result = await getSupportTicket(params.ticketNo)
  } catch {
    notFound()
  }

  if (!result?.success || !result.ticket) {
    notFound()
  }

  return <SupportTicketDetail initialTicket={result.ticket} />
}
