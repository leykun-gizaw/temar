import { DataTable } from '@/components/data-table';
import { LibraryBig } from 'lucide-react';
import { topics_data } from './dummy-topics-data';

export default function Page() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-6 flex items-center">
        <LibraryBig size={32} />
        <h1 className="text-3xl font-bold">Topics</h1>
      </div>
      <div className="px-6">
        <DataTable data={topics_data} />
      </div>
    </div>
  );
}
