import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export interface MessageTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  // Add any additional props specific to message functionality
  onSubmit?: () => void
}

export const MessageTextarea = React.forwardRef<HTMLTextAreaElement, MessageTextareaProps>(
  ({ className, onSubmit, onKeyDown, ...props }, ref) => {
    // Handle enter key submission while allowing shift+enter for new lines
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        onSubmit?.()
      }
      onKeyDown?.(e)
    }

    return (
      <Textarea
        ref={ref}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        rows={1}
        className={cn(
          "max-h-12 px-4 py-3 bg-background text-sm",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "w-full rounded-md flex items-center h-16 resize-none",
          className
        )}
        {...props}
      />
    )
  }
)

MessageTextarea.displayName = "MessageTextarea" 