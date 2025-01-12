'use client'

import { useState, KeyboardEvent, useRef, ChangeEvent, useEffect } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { MessageTextarea } from '@/components/messages/MessageTextarea'
import { Button } from '@/components/ui/button'
import { ImagePlus, Send } from 'lucide-react'
import { toast } from 'sonner'

interface MessageInputProps {
  channelId: string
}

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function MessageInput({ channelId }: MessageInputProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = useSupabase()
  const { user } = useAuth()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP).')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large. Maximum size is 5MB.')
      return
    }

    setIsUploading(true)
    try {
      // Upload to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`
      const { data, error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(fileName)

      // Send message with file
      const { error: messageError } = await supabase.from('messages').insert({
        content: content.trim() || 'Shared an image',
        channel_id: channelId,
        user_id: user.id,
        file_url: publicUrl
      })

      if (messageError) throw messageError

      setContent('')
      toast.success('Image uploaded successfully!')
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

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
        toast.error('Failed to send message. Please try again.')
        return
      }

      setContent('')
    } catch (error) {
      console.error('Error in sendMessage:', error)
      toast.error('Failed to send message. Please try again.')
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
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={ALLOWED_FILE_TYPES.join(',')}
        onChange={handleFileSelect}
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading || isSending}
        variant="ghost"
        size="icon"
        className="shrink-0"
      >
        <ImagePlus className="h-4 w-4" />
      </Button>
      <MessageTextarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onSubmit={sendMessage}
        placeholder={isUploading ? 'Uploading image...' : 'Type a message...'}
        disabled={isSending || isUploading}
        className="flex-1"
      />
      <Button
        onClick={sendMessage}
        disabled={(!content.trim() && !isUploading) || isSending}
        size="icon"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
} 