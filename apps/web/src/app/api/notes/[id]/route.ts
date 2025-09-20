import { NextResponse } from 'next/server';
import { Note, NoteInputSchema } from '@/lib/zod-schemas/note-schema';

// Share the same in-memory store used by /api/notes
const g = globalThis as unknown as { __notesStore?: Note[] };
g.__notesStore ||= [];
const notesStore = g.__notesStore;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const note = notesStore.find((n) => String(n.id) === String(params.id));
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(note, { status: 200 });
}

const NotePatchSchema = NoteInputSchema.partial();

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const idx = notesStore.findIndex((n) => String(n.id) === String(params.id));
  if (idx === -1)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = NotePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const current = notesStore[idx];
  const updated: Note = {
    ...current,
    ...parsed.data,
    updatedAt: new Date().toISOString(),
  };
  notesStore[idx] = updated;

  return NextResponse.json(updated, { status: 200 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const idx = notesStore.findIndex((n) => String(n.id) === String(params.id));
  if (idx === -1)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [deleted] = notesStore.splice(idx, 1);
  return NextResponse.json(deleted, { status: 200 });
}
