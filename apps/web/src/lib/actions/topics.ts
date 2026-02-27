'use server';

import { revalidatePath } from 'next/cache';
import { TopicInputSchema } from '../zod/topic-schema';
import { ErrorState } from '../definitions';
import { dbClient, topic, note, chunk } from '@temar/db-client';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { eq } from 'drizzle-orm';
import { NotionPage } from '@temar/shared-types';
import { syncServiceFetch } from '../sync-service';

export async function createTopic(
  state: ErrorState | undefined,
  payload: FormData
): Promise<ErrorState> {
  const validatedFields = TopicInputSchema.safeParse({
    title: payload.get('title'),
    description: payload.get('description'),
  });

  if (!validatedFields.success)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to create topic.',
    };

  try {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) throw new Error('User not logged in');

    const { title, description } = validatedFields.data;

    // Find the datasource ID from an existing sibling topic
    const [existingTopic] = await dbClient
      .select({
        datasourceId: topic.datasourceId,
        parentPageId: topic.parentPageId,
      })
      .from(topic)
      .where(eq(topic.userId, loggedInUser.id))
      .limit(1);

    let datasourceId: string;
    let parentPageId: string;

    if (existingTopic) {
      datasourceId = existingTopic.datasourceId;
      parentPageId = existingTopic.parentPageId || '';
    } else {
      // Fallback: resolve datasource from user's master page using existing endpoints
      const masterPageId = loggedInUser.notionPageId;
      if (!masterPageId) {
        return {
          errors: {},
          message: 'No master page found. Please set up a master page first.',
        };
      }

      // Find the Topics child_database block under the master page
      const blockChildren: {
        results: Array<{ id: string; type?: string }>;
      } = await syncServiceFetch(`block/${masterPageId}/children`, {
        userId: loggedInUser.id,
      });

      const childDb = blockChildren.results.find(
        (b) => b.type === 'child_database'
      );
      if (!childDb) {
        return {
          errors: {},
          message: 'Could not find Topics database under master page.',
        };
      }

      // Get the database to extract its datasource ID
      const database: {
        data_sources?: Array<{ id: string }>;
      } = await syncServiceFetch(`database/${childDb.id}`, {
        userId: loggedInUser.id,
      });

      if (!database.data_sources?.length) {
        return {
          errors: {},
          message: 'Topics database has no data sources.',
        };
      }

      datasourceId = database.data_sources[0].id;
      parentPageId = masterPageId;
    }

    // Create topic + notes DB + sample note + chunks DB + sample chunk in Notion
    const cascadeData: {
      topicPage: NotionPage;
      notePage: NotionPage;
      chunkPage: NotionPage;
    } = await syncServiceFetch('topic/create', {
      method: 'POST',
      body: {
        datasourceId,
        name: title,
        description,
      },
      userId: loggedInUser.id,
    });

    const { topicPage, notePage, chunkPage } = cascadeData;

    // Fetch chunk content with markdown
    const chunkContent: { results: unknown[]; contentMd: string } =
      await syncServiceFetch(`block/${chunkPage.id}/children_with_md`, {
        userId: loggedInUser.id,
      });

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
      await tx.insert(topic).values({
        id: topicPage.id,
        parentPageId,
        parentDatabaseId: topicParent.databaseId,
        datasourceId: topicParent.datasourceId,
        name: topicPage.properties.Name.title[0]?.plain_text ?? title,
        description:
          topicPage.properties.Description.rich_text[0]?.plain_text ??
          description,
        createdAt: new Date(topicPage.created_time),
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
        createdAt: new Date(topicPage.created_time),
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
        contentMd: chunkContent.contentMd,
        createdAt: new Date(topicPage.created_time),
        userId: loggedInUser.id,
      });
    });

    revalidatePath('/dashboard/topics');
    return { errors: {}, message: 'Topic created successfully.' };
  } catch (err) {
    console.error('createTopic error:', err);
    return {
      errors: {},
      message: `Database Error: Failed to create topic. ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}
