import { cn } from "@/lib/utils"

export const SUGGESTED_QUESTIONS = [
  "Is it a good time to go jogging?",
  "Should my children play outside today?",
  "What precautions should my family take?",
  "When should I open my windows?",
  "How can I reduce my pollution exposure?",
  "What is causing the current air quality situation?",
]

interface SuggestionPromptsProps {
  onSelect: (question: string) => void
  disabled?: boolean
  compact?: boolean
}

export function SuggestionPrompts({ onSelect, disabled, compact }: SuggestionPromptsProps) {
  return (
    <div
      className={cn(
        compact
          ? "flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden"
          : "grid gap-2 sm:grid-cols-2"
      )}
    >
      {SUGGESTED_QUESTIONS.map((question) => (
        <button
          key={question}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(question)}
          className={cn(
            "rounded-xl border bg-card text-left text-sm transition-colors hover:border-primary/40 hover:bg-accent disabled:pointer-events-none disabled:opacity-50",
            compact ? "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs" : "px-4 py-3"
          )}
        >
          {question}
        </button>
      ))}
    </div>
  )
}