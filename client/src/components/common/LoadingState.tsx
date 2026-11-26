import { LoaderCircle } from "lucide-react"

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
      <LoaderCircle className="size-5 animate-spin text-primary" />
      {label}
    </div>
  )
}