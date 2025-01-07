import { useState, KeyboardEvent } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { ChatInput } from '@/components/ui/chat/chat-input'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'

interface MessageInputProps {
  channelId: string
}

export function MessageInput({ channelId }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const supabase = useSupabase()
  const { user } = useAuth()

  const sendMessage = async () => {
    if (!content.trim() || !user) return

    try {
      setIsSending(true)
      const { error } = await supabase.from('messages').insert({
        content: content.trim(),
        channel_id: channelId,
        user_id: user.id,
      })

      if (error) {
        console.error('Error sending message:', error)
        return
      }

      setContent('')
    } catch (error) {
      console.error('Error in sendMessage:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="p-4 border-t flex gap-2 items-end">
      <ChatInput
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Type a message..."
        disabled={isSending}
        className="flex-1"
      />
      <Button
        onClick={sendMessage}
        disabled={!content.trim() || isSending}
        size="icon"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
} 