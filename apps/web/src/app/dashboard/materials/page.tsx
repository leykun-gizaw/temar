import { BookOpen } from 'lucide-react';

export default function MaterialsPage() {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground rounded-[2rem] bg-muted/30 shadow-md">
      <div className="text-center space-y-2">
        <BookOpen className="h-12 w-12 mx-auto opacity-30" />
        <p className="text-sm">Select an item from the tree to view details.</p>
      </div>
    </div>
  );
}
