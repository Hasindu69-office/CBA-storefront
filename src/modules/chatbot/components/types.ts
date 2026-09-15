export type ChatbotConfig = {
  enabled: boolean
  assistant_name: string
  greeting: string
  disclaimer: string
  quick_prompts: string[]
  handover_enabled: boolean
}

export type ChatbotAction = {
  key: string
  url: string
  product_id?: string
  variant_id?: string
}

export type ChatbotMessage = {
  id: string
  role: "user" | "assistant"
  message: string
  createdAt: Date
  actions?: ChatbotAction[]
  isError?: boolean
}

export type HandoverState = {
  recommended?: boolean
  reference?: string
  summary?: string
  status?: string
  whatsapp_url?: string
}

export type HandoverForm = { name: string; phone: string; consent: boolean }

export type ChatbotResponse = {
  message: string
  actions?: ChatbotAction[]
  handover?: { recommended?: boolean }
}

export type CurrentChatbotResponse = {
  messages: Array<{
    id: string
    role: "user" | "assistant"
    created_at?: string
    content: { message: string; actions?: ChatbotAction[] }
  }>
  handover?: HandoverState | null
}
