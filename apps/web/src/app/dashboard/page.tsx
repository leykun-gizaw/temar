import { PlaneTakeoffIcon } from 'lucide-react';

export default function Page() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-6 flex items-center gap-4">
        <PlaneTakeoffIcon size={32} />
        <h1 className="text-3xl font-bold">Overview</h1>
      </div>
      <div className="px-6"></div>
    </div>
  );
}
