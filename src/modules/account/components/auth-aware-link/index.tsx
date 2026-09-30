"use client"

import { safeAuthDestination } from "@lib/util/auth-modal"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useAuthModal } from "@modules/account/context/auth-modal-context"

export default function AuthAwareLink({ href, authenticated, children, onClick, ...props }: {
  href: string
  authenticated?: boolean
  children: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
  [key: string]: unknown
}) {
  const modal = useAuthModal()
  const isAuthenticated = authenticated ?? modal.authenticated
  return (
    <LocalizedClientLink
      href={href}
      {...props}
      onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event)
        if (event.defaultPrevented || isAuthenticated) return
        event.preventDefault()
        modal.open("sign-in", {
          intent: {
            behavior: "preserve-context",
            destination: safeAuthDestination(
              `${window.location.pathname}${window.location.search}`
            ) ?? "/",
          },
        })
      }}
    >
      {children}
    </LocalizedClientLink>
  )
}
