import { cn } from '@/lib/utils';

interface SideBarProps {
  className?: string;
}

export function SideBar({ className }: SideBarProps) {
  return (
    <aside 
      className={cn(
        "w-64 h-full shrink-0",
        "bg-gray-50 dark:bg-gray-900",
        "border-r border-gray-200 dark:border-gray-800",
        className
      )}
    >
      {/* Channel section header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          Channels
        </h2>
      </div>

      {/* Channel list placeholder */}
      <div className="p-2">
        <div className="space-y-1">
          {/* Placeholder items */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-9 px-2 rounded-md animate-pulse bg-gray-200 dark:bg-gray-800"
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
