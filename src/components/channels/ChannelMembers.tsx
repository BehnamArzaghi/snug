'use client';

import { useEffect, useState, useCallback, memo } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import type { Database } from '@/lib/database.types'
import { useAuth } from '@/lib/hooks/useAuth'
import { Shield, User, UserPlus, UserMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { toast } from 'sonner'
import { useChannel } from '@/hooks/useChannel'

// Robust type definitions for channel members
interface ChannelMemberWithUser {
  role: 'admin' | 'member';
  user: {
    id: string;
    email: string;
  };
}

interface ChannelMembersProps {
  channelId: string;
}

interface RoleChangeConfirmation {
  member: ChannelMemberWithUser;
  action: 'promote' | 'demote';
}

export const ChannelMembers = memo(function ChannelMembers({ 
  channelId 
}: ChannelMembersProps) {
  const supabase = useSupabaseClient<Database>()
  const { user } = useAuth()
  const channel = useChannel(channelId)
  const [members, setMembers] = useState<ChannelMemberWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [roleChange, setRoleChange] = useState<RoleChangeConfirmation | null>(null)
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false)

  const fetchMembers = useCallback(async () => {
    if (!channelId) return

    try {
      const { data, error } = await supabase
        .from('channel_members')
        .select(`
          role,
          user:users!inner (
            id,
            email
          )
        `)
        .eq('channel_id', channelId)
        .returns<ChannelMemberWithUser[]>()

      if (error) throw error

      setMembers(data || [])
      // Check if current user is admin
      setIsCurrentUserAdmin(
        data?.some(member => 
          member.user.id === user?.id && 
          member.role === 'admin'
        ) || false
      )
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Failed to load channel members')
    } finally {
      setLoading(false)
    }
  }, [channelId, user?.id, supabase])

  useEffect(() => {
    if (!channelId) return

    // Subscribe to member changes
    const subscription = supabase
      .channel(`channel-members-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channel_members',
          filter: `channel_id=eq.${channelId}`
        },
        () => {
          // Refetch on any changes
          fetchMembers()
        }
      )
      .subscribe()

    fetchMembers()

    return () => {
      subscription.unsubscribe()
    }
  }, [channelId, fetchMembers, supabase])

  const handleRoleChange = useCallback(async () => {
    if (!roleChange) return

    try {
      const { error } = await supabase
        .from('channel_members')
        .update({ 
          role: roleChange.action === 'promote' ? 'admin' : 'member'
        })
        .eq('channel_id', channelId)
        .eq('user_id', roleChange.member.user.id)

      if (error) throw error

      toast.success(
        roleChange.action === 'promote' 
          ? 'Member promoted to admin'
          : 'Admin demoted to member'
      )
    } catch (error) {
      console.error('Error changing role:', error)
      toast.error('Failed to change member role')
    } finally {
      setRoleChange(null)
    }
  }, [roleChange, channelId, supabase])

  if (!channel) {
    return null
  }

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            {members.length}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Channel Members</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {loading ? (
              <div>Loading members...</div>
            ) : (
              members.map((member) => (
                <div
                  key={member.user.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2">
                    {member.role === 'admin' && (
                      <Shield 
                        className="h-4 w-4 text-primary" 
                        aria-label="Admin"
                      />
                    )}
                    <span className="text-sm">
                      {member.user.email.split('@')[0]}
                      {member.user.id === user?.id && ' (you)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground capitalize">
                      {member.role}
                    </span>
                    {isCurrentUserAdmin && member.user.id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setRoleChange({
                          member,
                          action: member.role === 'admin' ? 'demote' : 'promote'
                        })}
                        className="ml-2"
                      >
                        {member.role === 'admin' ? (
                          <UserMinus className="h-4 w-4 text-destructive" />
                        ) : (
                          <UserPlus className="h-4 w-4 text-primary" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmationDialog
        open={!!roleChange}
        onOpenChange={(open) => !open && setRoleChange(null)}
        title={roleChange?.action === 'promote' ? 'Promote to Admin' : 'Demote to Member'}
        description={roleChange ? (
          roleChange.action === 'promote'
            ? `Are you sure you want to promote ${roleChange.member.user.email.split('@')[0]} to admin? They will be able to manage channel members and settings.`
            : `Are you sure you want to demote ${roleChange.member.user.email.split('@')[0]} to member? They will lose admin privileges.`
        ) : ''}
        actionLabel={roleChange?.action === 'promote' ? 'Promote' : 'Demote'}
        variant={roleChange?.action === 'promote' ? 'default' : 'destructive'}
        onConfirm={handleRoleChange}
      />
    </>
  )
}) 