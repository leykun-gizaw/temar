import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FloatingActionButton({
  icon,
  onClick,
  className,
}: {
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200',
        className
      )}
    >
      {icon ?? <Plus className="h-6 w-6" />}
    </button>
  );
}
