import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import { retrieveCustomer } from "@lib/data/customer"
import { retrieveAccountAuthSettings } from "@lib/data/account-auth"
import { AuthModalProvider } from "@modules/account/context/auth-modal-context"

export default async function CheckoutLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ countryCode: string }>
}) {
  const [{ countryCode }, customer, authSettings] = await Promise.all([
    params,
    retrieveCustomer().catch(() => null),
    retrieveAccountAuthSettings(),
  ])

  return (
    <AuthModalProvider
      settings={authSettings}
      countryCode={countryCode}
      authenticated={Boolean(customer)}
    >
      <Nav customer={customer} />
      <div className="w-full bg-white relative small:min-h-screen">
        <div className="relative" data-testid="checkout-container">
          {children}
        </div>
      </div>
      <Footer />
    </AuthModalProvider>
  )
}
