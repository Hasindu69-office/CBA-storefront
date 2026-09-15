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
  follow_up?: ChatbotFollowUp
  solution?: ChatbotSolution
}

export type ChatbotFollowUp = { question_id:string; label:string; type:"single_choice"|"text"; options:Array<{value:string;label:string}>; progress:{answered:number;total:number} }
export type ChatbotSolutionProduct = { id:string;handle:string;title:string;subtitle?:string|null;thumbnail?:{url:string;alt:string}|null;price:{currency_code:string;calculated_amount:number|null;status:string};inventory:{purchasable:boolean;status:string};default_variant?:{id:string;title:string}|null;has_multiple_variants:boolean;url:string }
export type ChatbotSolution = { id:string;revision_id:string;revision:number;name:string;completeness:"complete"|"partial"|"unavailable";verified_at:string;roles:Array<{id:string;label:string;required:boolean;min_quantity:number;notes:string;available:boolean;products:ChatbotSolutionProduct[]}> }

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
  follow_up?: ChatbotFollowUp
  solution?: ChatbotSolution
}

export type CurrentChatbotResponse = {
  messages: Array<{
    id: string
    role: "user" | "assistant"
    created_at?: string
    content: { message: string; actions?: ChatbotAction[]; follow_up?:ChatbotFollowUp; solution?:ChatbotSolution }
  }>
  handover?: HandoverState | null
}
