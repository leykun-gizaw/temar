import { Injectable } from '@nestjs/common';
import { dbClient, user, topic, note, chunk } from '@temar/db-client';
import { eq } from 'drizzle-orm';

export type EntityType = 'topic' | 'note' | 'chunk';

export type ClassificationResult =
  | { type: 'topic'; userId: string }
  | { type: 'note'; userId: string; parentTopicId: string }
  | { type: 'chunk'; userId: string; parentNoteId: string }
  | null;

@Injectable()
export class UserRepository {
  async findAll() {
    return dbClient.select().from(user);
  }

  async findById(userId: string) {
    const [row] = await dbClient
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    return row ?? null;
  }

  async findByWorkspaceId(workspaceId: string): Promise<string | null> {
    const [row] = await dbClient
      .select({ id: user.id })
      .from(user)
      .where(eq(user.notionWorkspaceId, workspaceId))
      .limit(1);
    return row?.id ?? null;
  }

  async updateNotionPageId(userId: string, notionPageId: string) {
    return dbClient
      .update(user)
      .set({ notionPageId })
      .where(eq(user.id, userId))
      .returning();
  }

  async entityExistsInAnyTable(entityId: string): Promise<boolean> {
    if (await this.topicExists(entityId)) return true;
    if (await this.noteExists(entityId)) return true;
    if (await this.chunkExists(entityId)) return true;
    return false;
  }

  async classifyParentPage(pageId: string): Promise<ClassificationResult> {
    const masterUser = await this.findMasterPageOwner(pageId);
    if (masterUser) return { type: 'topic', userId: masterUser };

    const parentTopic = await this.findTopicOwner(pageId);
    if (parentTopic) return { type: 'note', ...parentTopic };

    const parentNote = await this.findNoteOwner(pageId);
    if (parentNote) return { type: 'chunk', ...parentNote };

    return null;
  }

  async insertTopicWithCascade(
    topicData: typeof topic.$inferInsert,
    noteData: typeof note.$inferInsert,
    chunkData: typeof chunk.$inferInsert
  ) {
    return dbClient.transaction(async (tx) => {
      await tx.insert(topic).values(topicData);
      await tx.insert(note).values(noteData);
      await tx.insert(chunk).values(chunkData);
    });
  }

  async insertNoteWithChunk(
    noteData: typeof note.$inferInsert,
    chunkData: typeof chunk.$inferInsert
  ) {
    return dbClient.transaction(async (tx) => {
      await tx.insert(note).values(noteData);
      await tx.insert(chunk).values(chunkData);
    });
  }

  async insertChunk(chunkData: typeof chunk.$inferInsert) {
    return dbClient.insert(chunk).values(chunkData);
  }

  async identifyEntity(
    entityId: string
  ): Promise<{ type: EntityType; userId: string } | null> {
    const topicRow = await this.findTopicById(entityId);
    if (topicRow) return { type: 'topic', userId: topicRow.userId };

    const noteRow = await this.findNoteById(entityId);
    if (noteRow) return { type: 'note', userId: noteRow.userId };

    const chunkRow = await this.findChunkById(entityId);
    if (chunkRow) return { type: 'chunk', userId: chunkRow.userId };

    return null;
  }

  async updateEntityProperties(
    entityId: string,
    entityType: EntityType,
    properties: { name: string; description: string }
  ) {
    const table = this.tableForType(entityType);
    return dbClient
      .update(table)
      .set({ name: properties.name, description: properties.description })
      .where(eq(table.id, entityId));
  }

  async findNoteIdsByTopic(topicId: string): Promise<string[]> {
    const rows = await dbClient
      .select({ id: note.id })
      .from(note)
      .where(eq(note.topicId, topicId));
    return rows.map((r) => r.id);
  }

  async findChunkIdsByNote(noteId: string): Promise<string[]> {
    const rows = await dbClient
      .select({ id: chunk.id })
      .from(chunk)
      .where(eq(chunk.noteId, noteId));
    return rows.map((r) => r.id);
  }

  async deleteEntity(entityId: string, entityType: EntityType) {
    const table = this.tableForType(entityType);
    return dbClient.delete(table).where(eq(table.id, entityId));
  }

  async updateChunkContent(
    entityId: string,
    contentJson: unknown,
    contentMd: string
  ) {
    return dbClient
      .update(chunk)
      .set({ contentJson, contentMd, contentUpdatedAt: new Date() })
      .where(eq(chunk.id, entityId));
  }

  private tableForType(entityType: EntityType) {
    switch (entityType) {
      case 'topic':
        return topic;
      case 'note':
        return note;
      case 'chunk':
        return chunk;
    }
  }

  private async findTopicById(
    entityId: string
  ): Promise<{ userId: string } | null> {
    const [row] = await dbClient
      .select({ userId: topic.userId })
      .from(topic)
      .where(eq(topic.id, entityId))
      .limit(1);
    return row?.userId ? { userId: row.userId } : null;
  }

  private async findNoteById(
    entityId: string
  ): Promise<{ userId: string } | null> {
    const [row] = await dbClient
      .select({ userId: note.userId })
      .from(note)
      .where(eq(note.id, entityId))
      .limit(1);
    return row?.userId ? { userId: row.userId } : null;
  }

  private async findChunkById(
    entityId: string
  ): Promise<{ userId: string } | null> {
    const [row] = await dbClient
      .select({ userId: chunk.userId })
      .from(chunk)
      .where(eq(chunk.id, entityId))
      .limit(1);
    return row?.userId ? { userId: row.userId } : null;
  }

  private async topicExists(entityId: string): Promise<boolean> {
    const [row] = await dbClient
      .select({ id: topic.id })
      .from(topic)
      .where(eq(topic.id, entityId))
      .limit(1);
    return !!row;
  }

  private async noteExists(entityId: string): Promise<boolean> {
    const [row] = await dbClient
      .select({ id: note.id })
      .from(note)
      .where(eq(note.id, entityId))
      .limit(1);
    return !!row;
  }

  private async chunkExists(entityId: string): Promise<boolean> {
    const [row] = await dbClient
      .select({ id: chunk.id })
      .from(chunk)
      .where(eq(chunk.id, entityId))
      .limit(1);
    return !!row;
  }

  private async findMasterPageOwner(pageId: string): Promise<string | null> {
    const [row] = await dbClient
      .select({ id: user.id })
      .from(user)
      .where(eq(user.notionPageId, pageId))
      .limit(1);
    return row?.id ?? null;
  }

  private async findTopicOwner(
    pageId: string
  ): Promise<{ userId: string; parentTopicId: string } | null> {
    const [row] = await dbClient
      .select({ id: topic.id, userId: topic.userId })
      .from(topic)
      .where(eq(topic.id, pageId))
      .limit(1);

    if (!row?.userId) return null;
    return { userId: row.userId, parentTopicId: row.id };
  }

  private async findNoteOwner(
    pageId: string
  ): Promise<{ userId: string; parentNoteId: string } | null> {
    const [row] = await dbClient
      .select({ id: note.id, userId: note.userId })
      .from(note)
      .where(eq(note.id, pageId))
      .limit(1);

    if (!row?.userId) return null;
    return { userId: row.userId, parentNoteId: row.id };
  }
}
