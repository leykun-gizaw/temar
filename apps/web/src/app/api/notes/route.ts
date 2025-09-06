import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { Note, NoteInput, NoteInputSchema } from '@/lib/schemas/note-schema';

// Use a global store to survive HMR and share across route handlers
const g = globalThis as unknown as { __notesStore?: Note[] };
g.__notesStore ||= [];
const notesStore = g.__notesStore;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get('topicId') ?? undefined;

  let results = notesStore;
  if (topicId) {
    results = results.filter((n) => String(n.topicId) === String(topicId));
  }

  return NextResponse.json(results, { status: 200 });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = NoteInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const input: NoteInput = parsed.data;
  const now = new Date().toISOString();
  const note: Note = {
    id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
    createdAt: now,
    updatedAt: now,
    userId: undefined,
    ...input,
  };

  notesStore.unshift(note);

  // If you ever cache with `next: { tags }`, this ensures freshness
  revalidateTag(`notes:topic:${note.topicId}`);

  return NextResponse.json(note, { status: 201 });
}
