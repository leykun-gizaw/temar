import Link from 'next/link';
import AddTopicDialog from '@/app/dashboard/topics/_components/add-topic-dialog';
import { getFilteredTopics } from '@/lib/fetchers/topics';

function excerpt(value: unknown, max = 140) {
  const text =
    typeof value === 'string' ? value : value == null ? '' : String(value);
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}
export default async function GalleryList({
  query,
}: {
  query: string;
  type: string;
}) {
  const filteredTopics = await getFilteredTopics(query);
  return (
    <>
      {filteredTopics.map((item) => (
        <Link
          key={item.id}
          href={`/dashboard/topics/${encodeURIComponent(
            String(item.id)
          )}/notes`}
          className="border rounded-xl flex flex-col hover:bg-accent h-[180px] cursor-pointer"
        >
          <div className="flex-1 border-b text-xs text-muted-foreground whitespace-pre-wrap p-4 bg-muted/50">
            {excerpt(item.description)}
          </div>
          <div className="h-1/4 flex items-center pl-4">
            <span className="text-sm font-semibold">📚 {item.title}</span>
          </div>
        </Link>
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
