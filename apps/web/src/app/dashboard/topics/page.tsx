export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ topicId?: string; topicName?: string }>;
}) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">No topic selected</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a topic from the sidebar to view its notes.
        </p>
      </div>
    </div>
  );
}
