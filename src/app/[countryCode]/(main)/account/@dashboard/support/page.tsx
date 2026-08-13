import { Metadata } from "next"
import { redirect } from "next/navigation"

import { listSupportTickets } from "@lib/data/support"
import SupportTicketList from "@modules/support/components/support-ticket-list"

export const metadata: Metadata = {
  title: "Support",
}

export default async function AccountSupportPage() {
  let result
  try {
    result = await listSupportTickets({ limit: 20, offset: 0 })
  } catch {
    redirect("/account")
  }

  if (!result?.success) {
    redirect("/account")
  }

  return <SupportTicketList tickets={result.tickets} />
}
