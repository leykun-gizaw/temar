import { Note, NoteInputSchema, NoteInput } from '../zod/note-schema';
import { v4 as uuidv4 } from 'uuid';

const notes_data: Note[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    title: 'React Components',
    description: 'Understanding functional and class components in React.',
    topicId: 'c3d4e5f6-a7b8-9012-3456-7890abcdef23',
    createdAt: '2025-08-07T10:00:00.000Z',
    updatedAt: '2025-08-07T10:00:00.000Z',
    userId: '323e4567-e89b-12d3-a456-426614174002',
    slug: 'react-components',
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    title: 'React Hooks',
    description: 'Exploring useState, useEffect, and custom hooks.',
    topicId: 'c3d4e5f6-a7b8-9012-3456-7890abcdef23',
    createdAt: '2025-08-07T10:05:00.000Z',
    updatedAt: '2025-08-07T10:05:00.000Z',
    userId: '323e4567-e89b-12d3-a456-426614174002',
    slug: 'react-hooks',
  },
  {
    id: 'c3d4e5f6-a7b8-9012-bcde-f34567890123',
    title: 'Arrays & Linked Lists',
    description:
      'Basic operations and differences between arrays and linked lists.',
    topicId: 'd4e5f6a7-b8c9-0123-4567-890abcdef234',
    createdAt: '2025-08-07T10:10:00.000Z',
    updatedAt: '2025-08-07T10:10:00.000Z',
    userId: '423e4567-e89b-12d3-a456-426614174003',
    slug: 'arrays-linked-lists',
  },
  {
    id: 'd4e5f6a7-b8c9-0123-cdef-456789012345',
    title: 'Sorting Algorithms',
    description: 'Overview of bubble sort, merge sort, and quick sort.',
    topicId: 'd4e5f6a7-b8c9-0123-4567-890abcdef234',
    createdAt: '2025-08-07T10:15:00.000Z',
    updatedAt: '2025-08-07T10:15:00.000Z',
    userId: '423e4567-e89b-12d3-a456-426614174003',
    slug: 'sorting-algorithms',
  },
  {
    id: 'e5f6a7b8-c9d0-1234-def0-567890123456',
    title: 'Supervised Learning',
    description: 'Introduction to regression and classification techniques.',
    topicId: 'e5f6a7b8-c9d0-1234-5678-90abcdef2345',
    createdAt: '2025-08-07T10:20:00.000Z',
    updatedAt: '2025-08-07T10:20:00.000Z',
    userId: '523e4567-e89b-12d3-a456-426614174004',
    slug: 'supervised-learning',
  },
  {
    id: 'f6a7b8c9-d012-3456-ef01-678901234567',
    title: 'Unsupervised Learning',
    description: 'Clustering and dimensionality reduction methods.',
    topicId: 'e5f6a7b8-c9d0-1234-5678-90abcdef2345',
    createdAt: '2025-08-07T10:25:00.000Z',
    updatedAt: '2025-08-07T10:25:00.000Z',
    userId: '523e4567-e89b-12d3-a456-426614174004',
    slug: 'unsupervised-learning',
  },
];

export async function getAllTopicNotes(topicId: string) {
  return Promise.resolve(notes_data.filter((note) => note.topicId === topicId));
}
export async function getFilteredNotes(query: string, topicId: string) {
  return Promise.resolve(
    notes_data.filter(
      (note) =>
        note.topicId === topicId &&
        note.title.toLowerCase().includes(query.toLowerCase())
    )
  );
}

export async function getNoteById(id: string) {
  return Promise.resolve(notes_data.find((note) => note.id === id));
}
export async function addNote(noteInput: NoteInput, topicId: string) {
  const parsed = NoteInputSchema.safeParse(noteInput);
  if (!parsed.success) {
    throw new Error('Invalid note input');
  }
  const now = new Date().toISOString();
  const note: Note = {
    ...noteInput,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    topicId,
    slug: noteInput.title.toLowerCase().replace(/\s+/g, '-'),
  };
  notes_data.push(note);
  return Promise.resolve(note);
}
