import Link from 'next/link';
import { cn } from '@/lib/utils';

interface TopBarProps {
  className?: string;
}

export function TopBar({ className }: TopBarProps) {
  return (
    <header 
      className={cn(
        "h-14 flex items-center justify-between px-4",
        "bg-white dark:bg-gray-900",
        "border-b border-gray-200 dark:border-gray-800",
        className
      )}
    >
      {/* Logo/Brand */}
      <div className="flex items-center space-x-2">
        <Link href="/" className="flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          <span className="text-lg font-semibold">Snug</span>
        </Link>
      </div>

      {/* Right side - will add user menu later */}
      <div className="flex items-center space-x-4">
        {/* Placeholder for user menu */}
        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800" />
      </div>
    </header>
  );
} 