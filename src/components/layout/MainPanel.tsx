import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MainPanelProps {
  children: ReactNode;
  className?: string;
}

export function MainPanel({ children, className }: MainPanelProps) {
  return (
    <main 
      className={cn(
        "flex-1 h-full overflow-y-auto bg-white dark:bg-gray-900",
        "border-l border-gray-200 dark:border-gray-800",
        className
      )}
    >
      {children}
    </main>
  );
} 