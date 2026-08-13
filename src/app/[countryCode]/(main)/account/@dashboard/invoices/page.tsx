import { Metadata } from "next"
import { redirect } from "next/navigation"

import { listAccountDocuments } from "@lib/data/order-documents"
import DocumentList from "@modules/account/components/document-list"
import type { CbaOrderDocumentTypeFilter } from "types/order-documents"

export const metadata: Metadata = {
  title: "Invoices & Receipts",
  description: "Download receipts, invoices, and credit notes for your CBA orders.",
}

type Props = {
  searchParams: Promise<{ type?: string }>
}

function parseTypeFilter(
  value?: string
): CbaOrderDocumentTypeFilter | "all" {
  if (value === "receipt" || value === "invoice" || value === "credit_note") {
    return value
  }
  return "all"
}

export default async function AccountInvoicesPage(props: Props) {
  const searchParams = await props.searchParams
  const initialType = parseTypeFilter(searchParams.type)

  const result = await listAccountDocuments({
    limit: 50,
    offset: 0,
  })

  if (result === null) {
    redirect("/account")
  }

  return (
    <div className="w-full" data-testid="invoices-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-3">
        <h1 className="text-[28px] font-bold text-[#151922]">Invoices & Receipts</h1>
        <p className="text-[14px] text-[#5d6470]">
          Download order receipts, finance invoices, and credit notes.
        </p>
      </div>

      <DocumentList
        documents={result.documents ?? []}
        loadError={result.success === false}
        initialType={initialType}
      />
    </div>
  )
}
