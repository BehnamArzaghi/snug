import { useState } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchResultsPanel } from '@/components/search/SearchResultsPanel';
import { useRouter } from 'next/router';

interface TopBarProps {
  channelName?: string;
}

export function TopBar({ channelName }: TopBarProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const channelId = router.query.channelId as string;
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && channelId) {
      setIsSearchOpen(true);
    }
  };

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">
            {channelName ? `#${channelName}` : 'Snug'}
          </h1>
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
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">
              {user?.email?.split('@')[0]}
            </span>
            <span className="text-xs text-muted-foreground">
              Online
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => signOut()}
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Search Results Panel */}
      <SearchResultsPanel
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        query={searchQuery}
        channelId={channelId}
      />
    </>
  );
} 