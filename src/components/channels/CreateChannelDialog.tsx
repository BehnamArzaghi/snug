import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

interface CreateChannelDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateChannelDialog({ isOpen, onClose }: CreateChannelDialogProps) {
  const [channelName, setChannelName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('channels')
        .insert([{ name: channelName }])

      if (error) throw error
      
      setChannelName('')
      onClose()
    } catch (e) {
      setError('Failed to create channel')
      console.error('Error creating channel:', e)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Create Channel</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Input
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="Channel name"
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !channelName.trim()}
              >
                {loading ? 'Creating...' : 'Create Channel'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 