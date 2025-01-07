import { useEffect, useRef, useState } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { Message } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
} from '@/components/ui/chat/chat-bubble'
import MessageLoading from '@/components/ui/chat/message-loading'

interface MessageListProps {
  channelId: string
}

export function MessageList({ channelId }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = useSupabase()
  const { user } = useAuth()

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    // Initial messages fetch
    const fetchMessages = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            user:users(id, name, email)
          `)
          .eq('channel_id', channelId)
          .order('created_at', { ascending: true })
          .limit(50)

        if (error) {
          console.error('Error fetching messages:', error)
          return
        }

        setMessages(data || [])
        scrollToBottom()
      } catch (error) {
        console.error('Error in fetchMessages:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload: { new: Message }) => {
          const newMessage = payload.new
          setMessages((prev) => [...prev, newMessage])
          scrollToBottom()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [channelId, supabase])

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <ChatBubble key={i} variant="received">
              <ChatBubbleAvatar
                fallback="..."
              />
              <ChatBubbleMessage isLoading>
                <MessageLoading />
              </ChatBubbleMessage>
            </ChatBubble>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-4 flex flex-col">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            variant={message.user_id === user?.id ? 'sent' : 'received'}
          >
            <ChatBubbleAvatar
              fallback={message.user?.name?.[0] || '?'}
            />
            <ChatBubbleMessage>
              {message.content}
            </ChatBubbleMessage>
            <ChatBubbleTimestamp
              timestamp={formatDistanceToNow(new Date(message.created_at), {
                addSuffix: true,
              })}
            />
          </ChatBubble>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
} 