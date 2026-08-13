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
    <div className="flex-1 small:py-10" data-testid="account-page">
      <div className="mx-auto flex h-full w-full max-w-[1680px] flex-1 flex-col bg-white px-4 small:px-8 large:px-10">
        <div className="grid grid-cols-1 gap-5 py-6 small:grid-cols-[240px_minmax(0,1fr)] small:py-8">
          <div className="small:sticky small:top-24 small:self-start small:max-h-[calc(100vh-7rem)] small:overflow-y-auto">
            {customer && <AccountNav customer={customer} />}
          </div>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
