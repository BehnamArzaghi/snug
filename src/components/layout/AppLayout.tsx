import { ReactNode } from 'react';
import { TopBar } from './TopBar';
import { SideBar } from './SideBar';
import { MainPanel } from './MainPanel';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className={cn("flex h-screen flex-col", className)}>
      <TopBar />
      
      <div className="flex-1 flex overflow-hidden">
        <SideBar />
        <MainPanel>
          {children}
        </MainPanel>
      </div>
    </div>
  );
} 