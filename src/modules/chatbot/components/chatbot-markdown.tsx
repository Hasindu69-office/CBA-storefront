import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const SAFE_CHATBOT_ELEMENTS = ["p", "strong", "em", "ul", "ol", "li", "code", "br"]

export default function ChatbotMarkdown({ children }: { children: string }) {
  return <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    skipHtml
    allowedElements={SAFE_CHATBOT_ELEMENTS}
    unwrapDisallowed
    components={{
      p: ({ children }) => <p className="mb-2 whitespace-pre-wrap last:mb-0">{children}</p>,
      strong: ({ children }) => <strong className="font-bold text-grey-90">{children}</strong>,
      em: ({ children }) => <em className="italic">{children}</em>,
      ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
      ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
      li: ({ children }) => <li className="pl-0.5">{children}</li>,
      code: ({ children }) => <code className="rounded bg-grey-10 px-1 py-0.5 font-mono text-[0.9em]">{children}</code>,
    }}
  >{children}</ReactMarkdown>
}
