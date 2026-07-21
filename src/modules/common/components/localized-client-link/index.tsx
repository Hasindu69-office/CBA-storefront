"use client"

import { localizedPath } from "@lib/util/routes"
import Link from "next/link"
import React from "react"

/**
 * Use this component for storefront links. The app keeps the Medusa country
 * code internally, while public URLs stay region-neutral for the single region.
 */
const LocalizedClientLink = ({
  children,
  href,
  ...props
}: {
  children?: React.ReactNode
  href: string
  className?: string
  onClick?: () => void
  passHref?: true
  [x: string]: any
}) => {
  return <Link href={localizedPath(href)} {...props}>{children}</Link>
}

export default LocalizedClientLink
