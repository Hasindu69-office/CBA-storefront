"use client"

import { useEffect, useState } from "react"

export const CHATBOT_AVATAR_FALLBACK = "/images/Mr.Biz.png"

type Props = {
  src?: string | null
  alt?: string
  className: string
}

export default function ChatbotAvatar({ src, alt = "", className }: Props) {
  const [source, setSource] = useState(src || CHATBOT_AVATAR_FALLBACK)

  useEffect(() => {
    setSource(src || CHATBOT_AVATAR_FALLBACK)
  }, [src])

  return (
    <img
      src={source}
      alt={alt}
      className={className}
      onError={() => setSource(CHATBOT_AVATAR_FALLBACK)}
    />
  )
}
