import assert from "node:assert/strict"
import test from "node:test"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"

import ChatbotMarkdown from "../../../modules/chatbot/components/chatbot-markdown"

test("renders the chatbot's supported Markdown formatting", () => {
  const html = renderToStaticMarkup(
    <ChatbotMarkdown>{"**Phone:** 011 764 5200\n\n- Sales\n- Support"}</ChatbotMarkdown>
  )

  assert.match(html, /<strong[^>]*>Phone:<\/strong>/)
  assert.match(html, /<ul[^>]*>/)
  assert.match(html, /<li[^>]*>Sales<\/li>/)
  assert.doesNotMatch(html, /\*\*Phone:/)
})

test("does not activate model-provided HTML, links, or images", () => {
  const html = renderToStaticMarkup(
    <ChatbotMarkdown>{'<script>alert(1)</script> [Open](javascript:alert(1)) ![pixel](https://evil.example/pixel)'}</ChatbotMarkdown>
  )

  assert.doesNotMatch(html, /<script|<a\b|<img\b|href=|src=/i)
})
