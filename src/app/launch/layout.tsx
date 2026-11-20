import { Metadata } from "next"

export const metadata: Metadata = {
  title: "EBiz Launch | Ceylon Business Appliances",
  description: "Official EBiz storefront launch for Ceylon Business Appliances.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function LaunchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
