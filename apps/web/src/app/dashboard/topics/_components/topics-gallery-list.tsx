import Link from 'next/link';
import AddTopicDialog from '@/app/dashboard/topics/_components/add-topic-dialog';
import { getFilteredDBTopics, getFilteredTopics } from '@/lib/fetchers/topics';
import { getLoggedInUser } from '@/lib/fetchers/users';

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
  const currentUser = await getLoggedInUser();
  const notionTopics = await getFilteredDBTopics(
    currentUser?.notionPageId as string,
    query
  );
  return (
    <>
      {notionTopics.map((item) => (
        <Link
          key={item.id}
          href={`/dashboard/topics/${encodeURIComponent(
            String(item.id)
          )}/notes`}
          className="border rounded-xl flex flex-col hover:bg-accent h-[180px] cursor-pointer"
        >
          <div className="flex-1 border-b text-xs text-muted-foreground whitespace-pre-wrap p-4 bg-muted/50">
            {excerpt(item.properties.Description.rich_text[0].plain_text)}
          </div>
          <div className="h-1/4 flex items-center pl-4">
            <span className="text-sm font-semibold">
              📚
              {item.properties.Name.title[0].plain_text}
              {item.title}
            </span>
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
