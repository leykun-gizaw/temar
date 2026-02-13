import AddTopicDialog from '@/app/dashboard/topics/_components/add-topic-dialog';
import { getFilteredTopics } from '@/lib/fetchers/topics';
import TopicCardWrapper from './topic-card-wrapper';

export default async function GalleryList({
  query,
}: {
  query: string;
  type: string;
}) {
  const notionTopics = await getFilteredTopics(query);
  return (
    <>
      {notionTopics.map((item) => (
        <TopicCardWrapper key={item.id} item={item} />
      ))}
      <div className="border border-dashed rounded-xl flex flex-col h-[180px]">
        <div className="flex-1 text-xs text-muted-foreground whitespace-pre-wrap flex items-center justify-center">
          <AddTopicDialog
            trigger={
              <button className="text-sm text-muted-foreground font-normal w-full h-full cursor-pointer hover:bg-accent hover:rounded-xl">
                + New topic
              </button>
            }
          />
        </div>
      </div>
    </>
  );
}
