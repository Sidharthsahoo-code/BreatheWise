import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { MapPin, MessageSquarePlus, RefreshCw, SendHorizontal, Sparkles, TriangleAlert } from "lucide-react"
import { useApp } from "@/context/AppContext"
import { askAssistant } from "@/services/aiService"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { ChatHistoryItem, ChatMessageModel } from "@/types/assistant"
import { formatLocationShort } from "@/utils/formatters"
import { ChatMessage, ThinkingMessage } from "./ChatMessage"
import { SuggestionPrompts } from "./SuggestionPrompts"
import { useFamilyProfile } from "@/hooks/useFamilyProfile"

const STORAGE_KEY = "breathewise.chat"
const MAX_LENGTH = 500

function loadMessages(): ChatMessageModel[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return (parsed as ChatMessageModel[]).filter((m) =>
      m.role === "user"
        ? typeof m.text === "string"
        : typeof m.answer?.headline === "string" && Array.isArray(m.answer.actions)
    )
  } catch {
    return []
  }
}

function toHistory(messages: ChatMessageModel[]): ChatHistoryItem[] {
  return messages.slice(-8).map((m) =>
    m.role === "user"
      ? { role: "user", content: m.text }
      : { role: "assistant", content: `${m.answer.headline} ${m.answer.explanation}`.slice(0, 1900) }
  )
}

interface ErrorInfo {
  message: string
  question: string
}

export function ChatInterface() {
  const { location } = useApp()
  const { profile } = useFamilyProfile()
  const [messages, setMessages] = useState<ChatMessageModel[]>(loadMessages)
  const [draft, setDraft] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ErrorInfo | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Keep the conversation for this browser tab
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)))
    } catch {
      /* storage unavailable: history just won't persist */
    }
  }, [messages])

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" })
  }, [messages, pending, error])

  useEffect(() => () => abortRef.current?.abort(), [])

  async function send(question: string, echo = true) {
    const text = question.trim()
    if (!text || pending) return

    // On a retry the question is already in the list, so keep it out of the history
    const history = toHistory(echo ? messages : messages.slice(0, -1))

    if (echo) {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text }])
      setDraft("")
    }
    setError(null)
    setPending(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const result = await askAssistant(location, text, history, profile, controller.signal)
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", answer: result.data, meta: result.meta },
      ])
    } catch (err) {
      if (controller.signal.aborted) return
      setError({ message: err instanceof Error ? err.message : "Something went wrong.", question: text })
    } finally {
      if (!controller.signal.aborted) setPending(false)
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void send(draft)
    }
  }

  function newChat() {
    abortRef.current?.abort()
    setMessages([])
    setError(null)
    setPending(false)
    setDraft("")
  }

  const isEmpty = messages.length === 0 && !pending && !error

  return (
    <div className="flex h-[calc(100dvh-13rem)] min-h-[30rem] flex-col overflow-hidden rounded-2xl border bg-card shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <p className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0 text-primary" />
          <span className="truncate">
            Using live data for <span className="font-medium text-foreground">{formatLocationShort(location)}</span>
          </span>
        </p>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={newChat}>
            <MessageSquarePlus className="size-4" />
            New chat
          </Button>
        )}
      </div>

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {isEmpty ? (
          <div className="mx-auto flex max-w-xl flex-col items-center pt-4 text-center sm:pt-10">
            <div className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Sparkles className="size-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Ask about the air around you</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Answers use the latest modelled air quality for your selected city. They are general guidance, not medical
              advice.
            </p>
            <div className="mt-6 w-full text-left">
              <SuggestionPrompts onSelect={(q) => void send(q)} />
            </div>
          </div>
        ) : (
          messages.map((m) => <ChatMessage key={m.id} message={m} />)
        )}

        {pending && <ThinkingMessage />}

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"
          >
            <span className="flex items-center gap-2">
              <TriangleAlert className="size-4 shrink-0 text-destructive" />
              {error.message}
            </span>
            <Button variant="outline" size="sm" onClick={() => void send(error.question, false)}>
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2 border-t bg-card px-4 py-3">
        {!isEmpty && <SuggestionPrompts compact disabled={pending} onSelect={(q) => void send(q)} />}

        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={MAX_LENGTH}
            rows={1}
            placeholder="Ask a question about air quality…"
            aria-label="Your question"
            className="max-h-32 min-h-11 resize-none"
          />
          <Button
            size="icon"
            className="size-11 shrink-0"
            disabled={pending || draft.trim().length === 0}
            onClick={() => void send(draft)}
            aria-label="Send question"
          >
            <SendHorizontal className="size-5" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Based on modelled data, not a nearby monitor. AI can make mistakes.
          {draft.length > 400 && ` ${draft.length}/${MAX_LENGTH}`}
        </p>
      </div>
    </div>
  )
}