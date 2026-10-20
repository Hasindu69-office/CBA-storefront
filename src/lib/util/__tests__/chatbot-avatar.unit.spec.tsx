import assert from "node:assert/strict"
import test from "node:test"
import { CHATBOT_AVATAR_FALLBACK, launcherAvatar, panelHeaderAvatar } from "../../../modules/chatbot/components/chatbot-avatar-config"
import type { ChatbotConfig } from "../../../modules/chatbot/components/types"

const config: ChatbotConfig = {
  enabled: true,
  assistant_name: "CBA Assistant",
  greeting: "How can I help?",
  disclaimer: "AI responses may contain mistakes.",
  quick_prompts: [],
  handover_enabled: true,
  avatar_url: "/launcher.gif",
  avatar_alt_text: "Animated launcher",
  panel_avatar_url: "/panel.png",
  panel_avatar_alt_text: "Static header",
}

test("selects independent launcher and panel avatars", () => {
  assert.deepEqual(launcherAvatar(config), { url: "/launcher.gif", alt: "Animated launcher" })
  assert.deepEqual(panelHeaderAvatar(config), { url: "/panel.png", alt: "Static header" })
})

test("uses the bundled static fallback only for an unconfigured panel avatar", () => {
  assert.deepEqual(panelHeaderAvatar({ ...config, panel_avatar_url: null }), {
    url: CHATBOT_AVATAR_FALLBACK,
    alt: "Static header",
  })
  assert.equal(launcherAvatar({ ...config, avatar_url: null }).url, null)
})
