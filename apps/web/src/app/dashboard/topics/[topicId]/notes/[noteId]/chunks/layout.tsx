import { getNoteById } from '@/lib/fetchers/notes';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ noteId: string }>;
}): Promise<Metadata> {
  const { noteId } = await params;
  const note = await getNoteById(noteId);
  if (!note) {
    return {
      title: `Note - Chunks`,
      description: 'The selected note could not be found.',
    };
  }
  return { title: `${note.name} — Chunks`, description: note.description };
}

export default function NoteChunksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
