import type { ChatbotConfig } from "./types"

export const CHATBOT_AVATAR_FALLBACK = "/images/Mr.Biz.png"

export function launcherAvatar(config: ChatbotConfig) {
  return { url: config.avatar_url || null, alt: config.avatar_alt_text || "" }
}

export function panelHeaderAvatar(config: ChatbotConfig) {
  return { url: config.panel_avatar_url || CHATBOT_AVATAR_FALLBACK, alt: config.panel_avatar_alt_text || "" }
}
