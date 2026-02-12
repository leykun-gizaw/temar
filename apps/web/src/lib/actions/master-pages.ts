'use server';

import { revalidatePath } from 'next/cache';
import { MasterPageInputSchema } from '../zod/master-page-schema';
import { MasterPageErrorState } from '../definitions';
import { dbClient, user, topic, note, chunk } from '@temar/db-client';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { eq } from 'drizzle-orm';

import { NotionPage } from '@temar/shared-types';
import { AppendBlockChildrenResponse } from '@notionhq/client/build/src/api-endpoints';

export async function createMasterPage(
  state: MasterPageErrorState | undefined,
  payload: FormData
): Promise<MasterPageErrorState> {
  const validatedFields = MasterPageInputSchema.safeParse({
    notionMasterPageId: payload.get('notionMasterPageId'),
  });

  if (!validatedFields.success)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to create master page.',
    };

  try {
    const notionPageId = payload.get('notionMasterPageId') as string;
    const loggedInUser = await getLoggedInUser();
    const notionServiceApiEndpoint = process.env.NOTION_SERVICE_API_ENDPOINT;
    const notionSyncApiKey = process.env.NOTION_SYNC_API_KEY;

    if (!loggedInUser) throw Error('User not logged in');
    if (!notionPageId) throw Error('Page ID not found');
    const response = await fetch(
      `${notionServiceApiEndpoint}/page/${notionPageId}/prep_notion`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(notionSyncApiKey && { 'x-api-key': notionSyncApiKey }),
        },
        body: JSON.stringify({ notionPageId }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update Notion master page ID');
    } else {
      const data: {
        topicPage: NotionPage;
        notePage: NotionPage;
        chunkPage: NotionPage;
      } = await response.json();
      const { topicPage, notePage, chunkPage } = data;

      if (!topicPage || !notePage || !chunkPage) {
        throw new Error('Notion prep returned incomplete data');
      }

      const chunkResponse = await fetch(
        `${notionServiceApiEndpoint}/block/${chunkPage.id}/children`,
        {
          headers: {
            ...(notionSyncApiKey && { 'x-api-key': notionSyncApiKey }),
          },
        }
      );
      if (!chunkResponse.ok) {
        throw new Error('Failed to fetch chunk block children');
      }
      const chunkContent: AppendBlockChildrenResponse =
        await chunkResponse.json();

      const getParentIds = (page: NotionPage) => {
        const p = page.parent;
        if (p.type === 'data_source_id') {
          return { databaseId: p.database_id, datasourceId: p.data_source_id };
        }
        if (p.type === 'database_id') {
          return { databaseId: p.database_id, datasourceId: '' };
        }
        throw new Error(`Unexpected parent type: ${p.type}`);
      };

      const topicParent = getParentIds(topicPage);
      const noteParent = getParentIds(notePage);
      const chunkParent = getParentIds(chunkPage);

      await dbClient.transaction(async (tx) => {
        await tx
          .update(user)
          .set({ notionPageId })
          .where(eq(user.id, loggedInUser.id));

        await tx.insert(topic).values({
          id: topicPage.id,
          parentPageId: notionPageId,
          parentDatabaseId: topicParent.databaseId,
          datasourceId: topicParent.datasourceId,
          name: topicPage.properties.Name.title[0]?.plain_text ?? '',
          description:
            topicPage.properties.Description.rich_text[0]?.plain_text ?? '',
          userId: loggedInUser.id,
        });

        await tx.insert(note).values({
          id: notePage.id,
          topicId: topicPage.id,
          parentDatabaseId: noteParent.databaseId,
          datasourceId: noteParent.datasourceId,
          name: notePage.properties.Name.title[0]?.plain_text ?? '',
          description:
            notePage.properties.Description.rich_text[0]?.plain_text ?? '',
          userId: loggedInUser.id,
        });

        await tx.insert(chunk).values({
          id: chunkPage.id,
          noteId: notePage.id,
          parentDatabaseId: chunkParent.databaseId,
          datasourceId: chunkParent.datasourceId,
          name: chunkPage.properties.Name.title[0]?.plain_text ?? '',
          description:
            chunkPage.properties.Description.rich_text[0]?.plain_text ?? '',
          contentJson: chunkContent.results,
          userId: loggedInUser.id,
        });
      });
      revalidatePath('/dashboard/topics');
    }

    return { errors: {}, message: 'Master page created successfully.' };
  } catch (err) {
    // Log the error for debugging so we can see why the transaction rolled back
    // (keeps behavior safe for production while surfacing useful info during dev)
    console.error('createMasterPage error:', err);
    return {
      errors: {},
      message: `Database Error: Failed to create master page. ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}
