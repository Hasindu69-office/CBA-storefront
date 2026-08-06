import { Metadata } from "next"
import { redirect } from "next/navigation"

import { listOrders } from "@lib/data/orders"
import SupportNewTicketForm from "@modules/support/components/support-new-ticket-form"

export const metadata: Metadata = {
  title: "New support ticket",
}

export default async function AccountSupportNewPage() {
  let orders = []
  try {
    orders = (await listOrders(20, 0)) ?? []
  } catch {
    redirect("/account")
  }

  return <SupportNewTicketForm orders={orders} />
}
