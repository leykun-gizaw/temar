import * as React from 'react';
import AddTopicDialog from '@/app/dashboard/topics/_components/add-topic-dialog';
import { LayoutGridIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Search from './_components/search';
import GalleryList from './_components/topics-gallery-list';

import ConnectNotionButton from '@/app/dashboard/topics/_components/connect-notion-button';
import { getLoggedInUser } from '@/lib/fetchers/users';

export default async function TopicsPage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string }>;
}) {
  const params = await searchParams;
  const query = params?.query || '';

  const currentUser = await getLoggedInUser();

  if (!currentUser?.notionPageId) {
    const authUrl = process.env.NOTION_AUTHORIZATION_URL || '';
    return (
      <div className="col-span-full flex flex-col p-6 h-full m-2">
        <div className="flex items-end gap-2 space-y-1 border-b pb-4 mb-6">
          <span className="text-5xl">📚</span>
          <h1 className="text-2xl font-semibold mb-4">Topics</h1>
        </div>
        <div className="flex h-1/2 items-center justify-center">
          <div className="shadow max-w-xl w-full h-fit bg-muted/5 rounded-lg p-6 text-center space-y-8">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">
                Connect your Notion workspace
              </h2>
              <p className="text-sm text-muted-foreground">
                Connect to Notion to duplicate the Temar template and start
                syncing topics and notes to your workspace.
              </p>
            </div>
            <ConnectNotionButton
              authUrl={authUrl}
              trigger={
                <Button size="sm">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Connect to Notion
                </Button>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full px-6 py-2 space-y-4">
      <div className="flex flex-col w-fit">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl">📚</span>
          <h1 className="text-2xl font-semibold">Topics</h1>
        </div>
        <span className="text-sm text-muted-foreground">
          Select a topic to view its notes.
        </span>
      </div>
      <hr />

      <div className="flex flex-col items-center justify-between *:w-full gap-2">
        <h1 className="text-lg font-bold bg-primary/10 p-2">Topics Gallery</h1>
        <div className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2 bg-muted py-2 px-3 rounded-full">
            <LayoutGridIcon size={16} />
            Topics Gallery
          </span>
          <div className="flex gap-2 items-center max-w-sm w-full">
            <Search placeholder="Search..." />
            <AddTopicDialog
              trigger={
                <Button size="sm" className="">
                  <Plus className="mr-1.5 h-4 w-4" />
                  New
                </Button>
              }
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <GalleryList query={query} type="topic" />
      </div>
    </div>
  );
}
