'use server';

import { revalidatePath } from 'next/cache';
import { NoteInputSchema } from '../zod/note-schema';
import { ErrorState } from '../definitions';
import { dbClient, note, chunk } from '@temar/db-client';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { eq, and } from 'drizzle-orm';
import { NotionPage } from '@temar/shared-types';
import { syncServiceFetch } from '../sync-service';

export async function createNote(
  state: ErrorState | undefined,
  payload: FormData
): Promise<ErrorState> {
  const validatedFields = NoteInputSchema.safeParse({
    title: payload.get('title'),
    description: payload.get('description'),
  });

  if (!validatedFields.success)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to create note.',
    };

  const topicId = payload.get('topicId') as string;
  if (!topicId) {
    return { errors: {}, message: 'Topic ID is required.' };
  }

  try {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) throw new Error('User not logged in');

    const { title, description } = validatedFields.data;

    // Find the datasource ID from an existing sibling note under this topic
    const [existingNote] = await dbClient
      .select({ datasourceId: note.datasourceId })
      .from(note)
      .where(and(eq(note.userId, loggedInUser.id), eq(note.topicId, topicId)))
      .limit(1);

    let datasourceId: string;

    if (existingNote) {
      datasourceId = existingNote.datasourceId;
    } else {
      // Fallback: resolve datasource from the topic page's child database
      const blockChildren: {
        results: Array<{ id: string; type?: string }>;
      } = await syncServiceFetch(`block/${topicId}/children`, {
        userId: loggedInUser.id,
      });

      const childDb = blockChildren.results.find(
        (b) => b.type === 'child_database'
      );
      if (!childDb) {
        return {
          errors: {},
          message: 'Could not find Notes database under this topic.',
        };
      }

      const database: {
        data_sources?: Array<{ id: string }>;
      } = await syncServiceFetch(`database/${childDb.id}`, {
        userId: loggedInUser.id,
      });

      if (!database.data_sources?.length) {
        return {
          errors: {},
          message: 'Notes database has no data sources.',
        };
      }

      datasourceId = database.data_sources[0].id;
    }

    // Create note + chunks DB + sample chunk in Notion
    const cascadeData: {
      notePage: NotionPage;
      chunkPage: NotionPage;
    } = await syncServiceFetch('note/create', {
      method: 'POST',
      body: {
        datasourceId,
        name: title,
        description,
      },
      userId: loggedInUser.id,
    });

    const { notePage, chunkPage } = cascadeData;

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

    const noteParent = getParentIds(notePage);
    const chunkParent = getParentIds(chunkPage);

    await dbClient.transaction(async (tx) => {
      await tx.insert(note).values({
        id: notePage.id,
        topicId,
        parentDatabaseId: noteParent.databaseId,
        datasourceId: noteParent.datasourceId,
        name: notePage.properties.Name.title[0]?.plain_text ?? title,
        description:
          notePage.properties.Description.rich_text[0]?.plain_text ??
          description,
        createdAt: new Date(notePage.created_time),
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
        createdAt: new Date(notePage.created_time),
        userId: loggedInUser.id,
      });
    });

    revalidatePath(`/dashboard/topics/${topicId}/notes`);
    return { errors: {}, message: 'Note created successfully.' };
  } catch (err) {
    console.error('createNote error:', err);
    return {
      errors: {},
      message: `Database Error: Failed to create note. ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}
