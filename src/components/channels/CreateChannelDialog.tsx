'use client';

import { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '@/lib/database.types';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';
import { useChannelOperations } from '@/hooks/useChannel';

interface CreateChannelDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateChannelDialog = memo(function CreateChannelDialog({ 
  isOpen, 
  onClose 
}: CreateChannelDialogProps) {
  const { user } = useAuth();
  const supabase = useSupabaseClient<Database>();
  const { setChannels, channels } = useChannelOperations();
  
  const [channelName, setChannelName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to create a channel');
      return;
    }

    setLoading(true);

    try {
      // Create channel
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .insert([{ 
          name: channelName,
          is_private: isPrivate 
        }])
        .select()
        .single();

      if (channelError) throw channelError;
      
      // If private, add creator as admin
      if (isPrivate && channel) {
        const { error: memberError } = await supabase
          .from('channel_members')
          .insert([{
            channel_id: channel.id,
            user_id: user.id,
            role: 'admin'
          }]);

        if (memberError) throw memberError;
      }

      // Update local store
      if (channel) {
        setChannels([...channels, channel]);
      }

      toast.success('Channel created successfully');
      setChannelName('');
      setIsPrivate(false);
      onClose();
    } catch (error) {
      console.error('Error creating channel:', error);
      toast.error('Failed to create channel');
    } finally {
      setLoading(false);
    }
  }, [user, channelName, isPrivate, supabase, onClose, channels, setChannels]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Create Channel</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="channel-name">Channel Name</Label>
              <Input
                id="channel-name"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="e.g. project-updates"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="private"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
              <Label htmlFor="private">Private Channel</Label>
            </div>

            {isPrivate && (
              <p className="text-sm text-muted-foreground">
                Private channels are only visible to their members
              </p>
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
  );
}); 