import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Menu, X, Plus } from 'lucide-react';
import { ChannelList } from '@/components/channels/ChannelList';
import { CreateChannelDialog } from '@/components/channels/CreateChannelDialog';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-3 z-40 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Sidebar Content */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform bg-background transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          !isOpen && "-translate-x-full",
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b px-4">
            <h2 className="text-lg font-semibold">Channels</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              title="Create Channel"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus size={20} />
            </Button>
          </div>

          {/* Channel List */}
          <div className="flex-1 overflow-y-auto p-3">
            <ChannelList />
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Create Channel Dialog */}
      <CreateChannelDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </>
  );
} 