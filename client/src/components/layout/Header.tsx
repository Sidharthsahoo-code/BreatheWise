import { Menu, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { LocationSearch } from "./LocationSearch"

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { airQuality } = useApp()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Open navigation">
        <Menu className="size-5" />
      </Button>

      <LocationSearch />

      <div className="ml-auto">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={airQuality.retry}
              disabled={airQuality.loading}
              aria-label="Refresh air quality data"
            >
              <RefreshCw className={cn("size-4", airQuality.loading && "animate-spin")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh data</TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}