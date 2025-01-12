import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MainPanel } from './MainPanel';

interface AppLayoutProps {
  children?: ReactNode;
  isLoading?: boolean;
  channelName?: string;
  channelId?: string;
}

export function AppLayout({ children, isLoading, channelName, channelId }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar className="flex-shrink-0" />
      <div className="flex flex-1 flex-col">
        <TopBar channelName={channelName} channelId={channelId} />
        <div className="flex-1 overflow-hidden">
          <MainPanel isLoading={isLoading} channelId={channelId}>
            {children}
          </MainPanel>
        </div>
      </div>
    </div>
  );
} 