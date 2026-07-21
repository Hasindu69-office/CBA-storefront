import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Nav />
      <div className="w-full bg-white relative small:min-h-screen">
        <div className="relative" data-testid="checkout-container">
          {children}
        </div>
      </div>
      <Footer />
    </>
  )
}
