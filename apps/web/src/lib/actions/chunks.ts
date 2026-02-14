'use server';

import { revalidatePath } from 'next/cache';
import { ChunkInputSchema } from '../zod/chunk-schema';
import { ErrorState } from '../definitions';
import { dbClient, chunk } from '@temar/db-client';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { eq, and } from 'drizzle-orm';
import { NotionPage } from '@temar/shared-types';
import { syncServiceFetch } from '../sync-service';

export async function createChunk(
  state: ErrorState | undefined,
  payload: FormData
): Promise<ErrorState> {
  const validatedFields = ChunkInputSchema.safeParse({
    title: payload.get('title'),
    description: payload.get('description'),
  });

  if (!validatedFields.success)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to create chunk.',
    };

  const noteId = payload.get('noteId') as string;
  const topicId = payload.get('topicId') as string;
  if (!noteId || !topicId) {
    return { errors: {}, message: 'Note ID and Topic ID are required.' };
  }

  try {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) throw new Error('User not logged in');

    const { title, description } = validatedFields.data;

    // Find the datasource ID from an existing sibling chunk under this note
    const [existingChunk] = await dbClient
      .select({ datasourceId: chunk.datasourceId })
      .from(chunk)
      .where(and(eq(chunk.userId, loggedInUser.id), eq(chunk.noteId, noteId)))
      .limit(1);

    let datasourceId: string;

    if (existingChunk) {
      datasourceId = existingChunk.datasourceId;
    } else {
      // Fallback: resolve datasource from the note page's child database
      const blockChildren: {
        results: Array<{ id: string; type?: string }>;
      } = await syncServiceFetch(`block/${noteId}/children`, {
        userId: loggedInUser.id,
      });

      const childDb = blockChildren.results.find(
        (b) => b.type === 'child_database'
      );
      if (!childDb) {
        return {
          errors: {},
          message: 'Could not find Chunks database under this note.',
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
          message: 'Chunks database has no data sources.',
        };
      }

      datasourceId = database.data_sources[0].id;
    }

    // Create chunk page in Notion
    const chunkPage: NotionPage = await syncServiceFetch('chunk/create', {
      method: 'POST',
      body: {
        datasourceId,
        name: title,
        description,
      },
      userId: loggedInUser.id,
    });

    // Fetch chunk content with markdown
    const chunkContent: { results: unknown[]; contentMd: string } =
      await syncServiceFetch(`block/${chunkPage.id}/children_with_md`, {
        userId: loggedInUser.id,
      });

    const p = chunkPage.parent;
    let parentDatabaseId = '';
    if (p.type === 'data_source_id') {
      parentDatabaseId = p.database_id;
      datasourceId = p.data_source_id;
    } else if (p.type === 'database_id') {
      parentDatabaseId = p.database_id;
    }

    await dbClient.insert(chunk).values({
      id: chunkPage.id,
      noteId,
      parentDatabaseId,
      datasourceId,
      name: chunkPage.properties.Name.title[0]?.plain_text ?? title,
      description:
        chunkPage.properties.Description.rich_text[0]?.plain_text ??
        description,
      contentJson: chunkContent.results,
      contentMd: chunkContent.contentMd,
      userId: loggedInUser.id,
    });

    revalidatePath(`/dashboard/topics/${topicId}/notes/${noteId}/chunks`);
    return { errors: {}, message: 'Chunk created successfully.' };
  } catch (err) {
    console.error('createChunk error:', err);
    return {
      errors: {},
      message: `Database Error: Failed to create chunk. ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}
