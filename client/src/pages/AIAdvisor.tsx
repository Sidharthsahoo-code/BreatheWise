import { ChatInterface } from "@/components/assistant/ChatInterface"

export default function AIAdvisor() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">AI Air Assistant</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask about jogging, kids' playtime, windows and more, answered from live air quality data.
        </p>
      </div>
      <ChatInterface />
    </div>
  )
}