import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import type { Database } from '@/lib/database.types'
import { AppLayout } from '@/components/layout/AppLayout'

type Channel = Database['public']['Tables']['channels']['Row']

export default function ChannelPage() {
  const router = useRouter()
  const { channelId } = router.query
  const [channel, setChannel] = useState<Channel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useSupabaseClient<Database>()

  useEffect(() => {
    if (!channelId) return

    const fetchChannel = async () => {
      try {
        const { data, error } = await supabase
          .from('channels')
          .select('*')
          .eq('id', channelId)
          .single()

        if (error) throw error
        setChannel(data)
      } catch (e) {
        setError('Failed to load channel')
        console.error('Error loading channel:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchChannel()
  }, [channelId, supabase])

  return (
    <AppLayout 
      isLoading={loading} 
      channelName={channel?.name}
      channelId={typeof channelId === 'string' ? channelId : undefined}
    >
      {error ? (
        <div className="p-4 text-red-500">{error}</div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Messages will be rendered by MainPanel */}
        </div>
      )}
    </AppLayout>
  )
} 