'use client';

import { LibraryBig } from 'lucide-react';
import { useParams } from 'next/navigation';

const TopicPage = () => {
  const { slug } = useParams();
  const topicTitle = slug
    ? slug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : '';

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 h-full min-h-0">
      <div className="px-6 flex justify-between">
        <div className="flex flex-col">
          <div className="flex">
            <LibraryBig size={32} />
            <h1 className="text-2xl">{topicTitle} Notes</h1>
          </div>
          <span className="text-muted-foreground">Notes</span>
        </div>
      </div>
      <div className="h-full min-h-0 bg-muted/30"></div>
    </div>
  );
};

export default TopicPage;
