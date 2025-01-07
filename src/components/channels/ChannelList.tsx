import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Channel = Database['public']['Tables']['channels']['Row']

export function ChannelList() {
  const router = useRouter()
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initial fetch of channels
    const fetchChannels = async () => {
      try {
        const { data, error } = await supabase
          .from('channels')
          .select('*')
          .order('name')
        
        if (error) throw error
        setChannels(data || [])
      } catch (e) {
        setError('Failed to load channels')
        console.error('Error loading channels:', e)
      } finally {
        setLoading(false)
      }
    }

    // Subscribe to channel changes
    const channelSubscription = supabase
      .channel('channel-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channels'
        },
        async (payload) => {
          // Refetch channels to ensure we have the latest data
          await fetchChannels()
        }
      )
      .subscribe()

    // Initial fetch
    fetchChannels()

    // Cleanup subscription
    return () => {
      channelSubscription.unsubscribe()
    }
  }, [])

  const handleChannelClick = (channelId: string) => {
    router.push(`/channels/${channelId}`)
  }

  if (loading) {
    return <div className="p-4">Loading channels...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  return (
    <div className="space-y-1">
      {channels.map((channel) => (
        <button
          key={channel.id}
          onClick={() => handleChannelClick(channel.id)}
          className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${
            router.query.channelId === channel.id
              ? 'bg-gray-100 dark:bg-gray-800'
              : ''
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium"># {channel.name}</span>
          </div>
        </button>
      ))}
    </div>
  )
} 