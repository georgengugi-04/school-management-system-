"use client"
import { useToast } from "@/hooks/use-toast"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts, dismiss } = useToast()
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
      {toasts.map(({ id, title, description, variant }) => (
        <div key={id}
          className={cn(
            "flex items-start gap-3 rounded-xl border p-4 shadow-lg animate-fade-in",
            variant === "destructive"
              ? "bg-destructive text-destructive-foreground border-destructive"
              : "bg-card border-border text-foreground"
          )}>
          <div className="flex-1 min-w-0">
            {title && <p className="text-sm font-semibold">{title}</p>}
            {description && <p className="text-xs mt-0.5 opacity-80">{description}</p>}
          </div>
          <button onClick={() => dismiss(id)}
            className="shrink-0 opacity-70 hover:opacity-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
