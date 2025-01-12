import { useEffect, useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/router';
import { ChannelMembers } from '@/components/channels/ChannelMembers';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { usePresence } from '@/lib/hooks/usePresence';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Database } from '@/lib/database.types';

interface TopBarProps {
  channelName?: string;
  channelId?: string;
}

type Notification = Database['public']['Tables']['notifications']['Row'];

export function TopBar({ channelName, channelId }: TopBarProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const supabase = useSupabaseClient<Database>();
  const { toast } = useToast();
  const { presenceStatus } = usePresence();
  
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userData, setUserData] = useState<{ name: string; avatar_url: string | null } | null>(null);

  // Fetch user data
  useEffect(() => {
    async function fetchUserData() {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('name, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user data',
          variant: 'destructive',
        });
      }
    }

    fetchUserData();
  }, [user?.id, supabase, toast]);

  // Subscribe to notifications
  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    // Initial fetch of unread notifications
    async function fetchNotifications() {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .eq('is_read', false)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setNotifications(data || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    }

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase.channel(`notifications:${userId}`);
    const subscription = channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload: { new: Notification }) => {
        setNotifications(prev => [payload.new, ...prev]);
        toast({
          title: payload.new.title,
          description: payload.new.content || undefined,
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, supabase, toast]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      // TODO: Implement message search using proper indexes
      console.log('Search query:', searchQuery);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Failed',
        description: 'Unable to perform search. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const markNotificationsAsRead = async () => {
    if (!user?.id || notifications.length === 0) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      setNotifications([]);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-semibold">
          {channelName ? `#${channelName}` : 'Snug'}
        </h1>
        {channelId && <ChannelMembers channelId={channelId} />}
      </div>

      {/* Search Bar */}
      <form 
        className="flex max-w-md flex-1 items-center px-4"
        onSubmit={handleSearch}
      >
        <div className="relative w-full">
          <Search 
            className={`absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform ${
              isSearchFocused ? 'text-primary' : 'text-muted-foreground'
            }`}
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-8"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </div>
      </form>

      {/* User Actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={markNotificationsAsRead}
            className="relative"
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
              >
                {notifications.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* User Profile */}
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={userData?.avatar_url || undefined} />
            <AvatarFallback>
              {userData?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {userData?.name || user?.email?.split('@')[0]}
            </span>
            <span className="text-xs text-muted-foreground">
              {presenceStatus}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => signOut()}
        >
          Sign Out
        </Button>
      </div>
    </header>
  );
} 