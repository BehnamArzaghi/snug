import { ReactNode, useState, KeyboardEvent, useEffect, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImagePlus, Send } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { MessageList } from '@/components/messages/MessageList';
import { useMessageOperations } from '@/hooks/useMessageOperations';
import { toast } from 'sonner';
import Image from 'next/image';

interface MainPanelProps {
  children?: ReactNode;
  isLoading?: boolean;
  channelId?: string;
}

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function MainPanel({ children, isLoading, channelId }: MainPanelProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage } = useMessageOperations(channelId || '');

  // Clear preview and uploaded URL when message sends successfully
  const clearFileStates = () => {
    setPreviewUrl(null);
    setUploadedUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !channelId) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP).');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    // Create preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    setIsUploading(true);
    try {
      // TODO: Move file upload logic to a separate hook (useFileUpload)
      // For now, we'll just handle text messages
      toast.error('File uploads coming soon!');
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload image. Please try again.');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!channelId || !message.trim()) return;

    setIsSending(true);
    try {
      await sendMessage(message);
      setMessage('');
      clearFileStates();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clean up object URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : channelId ? (
          <MessageList channelId={channelId} />
        ) : children}
      </div>

      {channelId && (
        <div className="border-t p-4">
          <div className="flex flex-col space-y-2">
            {previewUrl && (
              <div className="relative w-full max-w-[300px] aspect-video">
                <Image
                  src={previewUrl}
                  alt="Upload preview"
                  fill
                  className="rounded-md object-contain"
                />
              </div>
            )}
            <div className="flex items-center space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={ALLOWED_FILE_TYPES.join(',')}
                onChange={handleFileSelect}
              />
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isSending}
              >
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isUploading ? 'Uploading image...' : 'Type a message...'}
                className="flex-1"
                disabled={isSending || isUploading}
              />
              <Button
                size="icon"
                className="shrink-0"
                onClick={handleSendMessage}
                disabled={(!message.trim() && !uploadedUrl) || isSending || isUploading}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 