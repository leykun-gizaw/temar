'use server';

import { revalidatePath } from 'next/cache';
import { MasterPageInputSchema } from '../zod/master-page-schema';
import { MasterPageErrorState } from '../definitions';
import { dbClient, user, topic, note, chunk } from '@temar/db-client';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { eq } from 'drizzle-orm';

import {
  AppendBlockChildrenResponse,
  CreatePageResponse,
} from '@notionhq/client/build/src/api-endpoints';

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

    if (!loggedInUser) throw Error('User not logged in');
    if (!notionPageId) throw Error('Page ID not found');
    const response = await fetch(
      `${notionServiceApiEndpoint}/page/${notionPageId}/prep_notion`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notionPageId }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update Notion master page ID');
    } else {
      const data: {
        topicPage: CreatePageResponse;
        notePage: CreatePageResponse;
        chunkPage: CreatePageResponse;
      } = await response.json();
      const topicPage = data.topicPage;
      const notePage = data.notePage;
      const chunkPage = data.chunkPage;

      const chunkResponse = await fetch(
        `${notionServiceApiEndpoint}/block/${chunkPage.id}/children`
      );
      const chunkContent: AppendBlockChildrenResponse =
        await chunkResponse.json();

      await dbClient.transaction(async (tx) => {
        await tx
          .update(user)
          .set({ notionPageId })
          .where(eq(user.id, loggedInUser.id));
        await tx.insert(topic).values({
          id: topicPage.id,
          parentPageId: notionPageId,
          parentDatabaseId: topicPage.parent.database_id,
          datasourceId: topicPage.parent.data_source_id,
          name: topicPage.properties.Name.title[0].plain_text,
          description: topicPage.properties.Description.rich_text[0].plain_text,
        });

        await tx.insert(note).values({
          id: notePage.id,
          topicId: topicPage.id,
          parentDatabaseId: notePage.parent.database_id,
          datasourceId: notePage.parent.data_source_id,
          name: notePage.properties.Name.title[0].plain_text,
          description: notePage.properties.Description.rich_text[0].plain_text,
        });

        await tx.insert(chunk).values({
          id: chunkPage.id,
          noteId: notePage.id,
          parentDatabaseId: chunkPage.parent.database_id,
          datasourceId: chunkPage.parent.data_source_id,
          name: chunkPage.properties.Name.title[0].plain_text,
          description: chunkPage.properties.Description.rich_text[0].plain_text,
          contentJson: chunkContent.results,
        });
      });
      revalidatePath('dashboard/topics');
    }

    return { errors: {}, message: 'Master page created successfully.' };
  } catch {
    return {
      errors: {},
      message: 'Database Error: Failed to create master page.',
    };
  }
}
