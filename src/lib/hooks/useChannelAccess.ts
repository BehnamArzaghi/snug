import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../supabase'
import type { Database } from '../database.types'
import { toast } from 'sonner'

type AccessRequest = Database['public']['Tables']['access_requests']['Row'] & {
  user?: Database['public']['Tables']['users']['Row']
  channel?: Database['public']['Tables']['channels']['Row']
}

export function useChannelAccess(channelId?: string) {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMember, setIsMember] = useState(false)
  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Check if user is admin/member of the channel
  useEffect(() => {
    if (!user || !channelId) return

    const checkMembership = async () => {
      try {
        const { data: membership, error } = await supabase
          .from('channel_members')
          .select('role')
          .eq('channel_id', channelId)
          .eq('user_id', user.id)
          .single()

        if (error) throw error

        setIsAdmin(membership?.role === 'admin')
        setIsMember(!!membership)
      } catch (error) {
        console.error('Error checking membership:', error)
        setIsAdmin(false)
        setIsMember(false)
      }
    }

    checkMembership()
  }, [user, channelId])

  // Check for pending request
  useEffect(() => {
    if (!user || !channelId || isMember) return

    const checkPendingRequest = async () => {
      try {
        const { data: request, error } = await supabase
          .from('access_requests')
          .select('status')
          .eq('channel_id', channelId)
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .single()

        if (error && error.code !== 'PGRST116') throw error // PGRST116 is "no rows returned"

        setHasPendingRequest(!!request)
      } catch (error) {
        console.error('Error checking pending request:', error)
        setHasPendingRequest(false)
      }
    }

    checkPendingRequest()
  }, [user, channelId, isMember])

  // Fetch access requests if admin
  useEffect(() => {
    if (!channelId || !isAdmin) {
      setAccessRequests([])
      setLoading(false)
      return
    }

    const fetchRequests = async () => {
      try {
        const { data, error } = await supabase
          .from('access_requests')
          .select(`
            *,
            user:users(*),
            channel:channels(*)
          `)
          .eq('channel_id', channelId)
          .eq('status', 'pending')

        if (error) throw error

        setAccessRequests(data || [])
      } catch (error) {
        console.error('Error fetching access requests:', error)
        toast.error('Failed to load access requests')
      } finally {
        setLoading(false)
      }
    }

    // Subscribe to access_requests changes
    const subscription = supabase
      .channel(`access-requests-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'access_requests',
          filter: `channel_id=eq.${channelId}`
        },
        () => {
          // Refetch on any changes
          fetchRequests()
        }
      )
      .subscribe()

    fetchRequests()

    return () => {
      subscription.unsubscribe()
    }
  }, [channelId, isAdmin])

  const requestAccess = async () => {
    if (!user || !channelId || isMember || hasPendingRequest) return

    try {
      const { error } = await supabase
        .from('access_requests')
        .insert([
          {
            channel_id: channelId,
            user_id: user.id,
            status: 'pending'
          }
        ])

      if (error) throw error

      setHasPendingRequest(true)
      toast.success('Access request sent')
    } catch (error) {
      console.error('Error requesting access:', error)
      toast.error('Failed to request access')
    }
  }

  const handleRequest = async (requestId: string, approve: boolean) => {
    if (!isAdmin) return

    try {
      // Get the current request to check updated_at
      const { data: currentRequest, error: fetchError } = await supabase
        .from('access_requests')
        .select('updated_at, status')
        .eq('id', requestId)
        .single()

      if (fetchError) throw fetchError

      // Don't update if request is no longer pending
      if (currentRequest.status !== 'pending') {
        toast.error('This request has already been processed')
        return
      }

      const status = approve ? 'approved' : 'denied'
      const { error: updateError } = await supabase
        .from('access_requests')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        // Only update if updated_at hasn't changed (optimistic locking)
        .eq('updated_at', currentRequest.updated_at)

      if (updateError) {
        // If update fails due to concurrent modification
        if (updateError.code === '23514') {
          toast.error('This request was modified by another admin')
          return
        }
        throw updateError
      }

      if (approve) {
        // Add user to channel_members
        const request = accessRequests.find(r => r.id === requestId)
        if (request) {
          const { error: memberError } = await supabase
            .from('channel_members')
            .insert([
              {
                channel_id: request.channel_id,
                user_id: request.user_id,
                role: 'member'
              }
            ])

          if (memberError) throw memberError
        }
      }

      toast.success(`Request ${approve ? 'approved' : 'denied'}`)
    } catch (error) {
      console.error('Error handling request:', error)
      toast.error('Failed to process request')
    }
  }

  return {
    isAdmin,
    isMember,
    hasPendingRequest,
    accessRequests,
    loading,
    requestAccess,
    handleRequest
  }
} 