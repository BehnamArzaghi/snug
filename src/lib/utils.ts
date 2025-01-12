import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 

export function formatMessageTimestamp(date: string | Date) {
  const messageDate = new Date(date)
  
  if (isToday(messageDate)) {
    return format(messageDate, "'Today at' h:mm a")
  }
  
  if (isYesterday(messageDate)) {
    return format(messageDate, "'Yesterday at' h:mm a")
  }
  
  // If it's within the last 7 days, show relative time
  const daysAgo = Math.floor((Date.now() - messageDate.getTime()) / (1000 * 60 * 60 * 24))
  if (daysAgo < 7) {
    return formatDistanceToNow(messageDate, { addSuffix: true })
  }
  
  // Otherwise show the full date
  return format(messageDate, "MMM d, yyyy 'at' h:mm a")
}

export function formatMessagePreview(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
} 