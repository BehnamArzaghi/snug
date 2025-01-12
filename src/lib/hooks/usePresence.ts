import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Database } from '@/lib/database.types';

type PresenceStatus = 'online' | 'idle' | 'offline';

export function usePresence() {
  const [presenceStatus, setPresenceStatus] = useState<PresenceStatus>('online');
  const supabase = useSupabaseClient<Database>();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    let lastActivity = Date.now();
    let idleTimeout: NodeJS.Timeout;

    // Update last_seen in database
    const updatePresence = async () => {
      try {
        const { error } = await supabase
          .from('users')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating presence:', error);
        }
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    };

    // Check for idle state
    const checkIdle = () => {
      const now = Date.now();
      if (now - lastActivity > 5 * 60 * 1000) { // 5 minutes
        setPresenceStatus('idle');
      }
    };

    // Update last activity on user interactions
    const handleActivity = () => {
      lastActivity = Date.now();
      if (presenceStatus !== 'online') {
        setPresenceStatus('online');
        updatePresence();
      }
    };

    // Set up activity listeners
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    // Initial presence update
    updatePresence();

    // Set up idle checking interval
    idleTimeout = setInterval(checkIdle, 60 * 1000); // Check every minute

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearInterval(idleTimeout);
    };
  }, [user?.id, supabase, presenceStatus]);

  return { presenceStatus };
} 