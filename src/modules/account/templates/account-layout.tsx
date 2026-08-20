import React from "react"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  if (!customer) {
    return (
      <div className="cba-auth-page flex-1 bg-white" data-testid="account-page">
        {children}
      </div>
    )
  }

  return (
    <div className="flex-1 bg-[#f7f8fa]" data-testid="account-page">
      <div className="mx-auto flex h-full w-full max-w-[1680px] flex-1 flex-col">
        <div className="grid min-h-[calc(100vh-88px)] grid-cols-1 small:grid-cols-[260px_minmax(0,1fr)]">
          <div className="contents small:block small:self-stretch">
            {customer && <AccountNav customer={customer} />}
          </div>
          <div className="min-w-0 flex-1 px-4 py-5 small:px-6 small:py-7 large:px-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
