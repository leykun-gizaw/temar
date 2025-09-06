import { Topic } from '@/lib/topic-types';
import { TopicSchema } from '@/lib/schemas/topic-schema';
import { NextResponse } from 'next/server';

const topics_data: Topic[] = [
  {
    id: 'c3d4e5f6-a7b8-9012-3456-7890abcdef23',
    name: 'React',
    description:
      'A deep dive into the React library for building user interfaces.',
    createdAt: '2025-08-07T09:10:05.000Z',
    updatedAt: '2025-08-07T09:10:05.000Z',
    userId: '323e4567-e89b-12d3-a456-426614174002',
  },
  {
    id: 'd4e5f6a7-b8c9-0123-4567-890abcdef234',
    name: 'Data Structures & Algorithms',
    description: 'An introduction to common data structures and algorithms.',
    createdAt: '2025-08-07T09:15:00.000Z',
    updatedAt: '2025-08-07T09:15:00.000Z',
    userId: '423e4567-e89b-12d3-a456-426614174003',
  },
  {
    id: 'e5f6a7b8-c9d0-1234-5678-90abcdef2345',
    name: 'Machine Learning',
    description: 'An overview of machine learning concepts and techniques.',
    createdAt: '2025-08-07T09:20:00.000Z',
    updatedAt: '2025-08-07T09:20:00.000Z',
    userId: '523e4567-e89b-12d3-a456-426614174004',
  },
  {
    id: 'f6a7b8c9-d012-3456-7890-abcdef234567',
    name: 'Artificial Intelligence',
    description: 'Exploring the foundations of artificial intelligence.',
    createdAt: '2025-08-07T09:25:00.000Z',
    updatedAt: '2025-08-07T09:25:00.000Z',
    userId: '623e4567-e89b-12d3-a456-426614174005',
  },
  {
    id: 'a7b8c9d0-1234-5678-90ab-cdef23456789',
    name: 'Operating Systems',
    description: 'Understanding the principles of operating systems.',
    createdAt: '2025-08-07T09:30:00.000Z',
    updatedAt: '2025-08-07T09:30:00.000Z',
    userId: '723e4567-e89b-12d3-a456-426614174006',
  },
  {
    id: 'b8c9d012-3456-7890-abcd-ef2345678901',
    name: 'Computer Networks',
    description: 'A study of computer networking concepts and protocols.',
    createdAt: '2025-08-07T09:35:00.000Z',
    updatedAt: '2025-08-07T09:35:00.000Z',
    userId: '823e4567-e89b-12d3-a456-426614174007',
  },
  {
    id: 'c9d01234-5678-90ab-cdef-234567890123',
    name: 'Database Systems',
    description: 'Introduction to database design and management.',
    createdAt: '2025-08-07T09:40:00.000Z',
    updatedAt: '2025-08-07T09:40:00.000Z',
    userId: '923e4567-e89b-12d3-a456-426614174008',
  },
  {
    id: 'd0123456-7890-abcd-ef23-456789012345',
    name: 'Cybersecurity',
    description: 'Fundamentals of cybersecurity and best practices.',
    createdAt: '2025-08-07T09:45:00.000Z',
    updatedAt: '2025-08-07T09:45:00.000Z',
    userId: 'a23e4567-e89b-12d3-a456-426614174009',
  },
  {
    id: 'e1234567-890a-bcde-f234-567890123456',
    name: 'Cloud Computing',
    description: 'An introduction to cloud computing and its services.',
    createdAt: '2025-08-07T09:50:00.000Z',
    updatedAt: '2025-08-07T09:50:00.000Z',
    userId: 'b23e4567-e89b-12d3-a456-426614174010',
  },
  {
    id: 'f2345678-90ab-cdef-3456-789012345678',
    name: 'Software Engineering',
    description: 'Principles and practices of software development.',
    createdAt: '2025-08-07T09:55:00.000Z',
    updatedAt: '2025-08-07T09:55:00.000Z',
    userId: 'c23e4567-e89b-12d3-a456-426614174011',
  },
  {
    id: '01234567-89ab-cdef-4567-890123456789',
    name: 'Web Development',
    description: 'Building modern web applications and websites.',
    createdAt: '2025-08-07T10:00:00.000Z',
    updatedAt: '2025-08-07T10:00:00.000Z',
    userId: 'd23e4567-e89b-12d3-a456-426614174012',
  },
  {
    id: '12345678-9abc-def0-5678-901234567890',
    name: 'Mobile App Development',
    description: 'Creating applications for mobile platforms.',
    createdAt: '2025-08-07T10:05:00.000Z',
    updatedAt: '2025-08-07T10:05:00.000Z',
    userId: 'e23e4567-e89b-12d3-a456-426614174013',
  },
  {
    id: '23456789-abcd-ef01-6789-012345678901',
    name: 'Blockchain Technology',
    description: 'Understanding blockchain and its applications.',
    createdAt: '2025-08-07T10:10:00.000Z',
    updatedAt: '2025-08-07T10:10:00.000Z',
    userId: 'f23e4567-e89b-12d3-a456-426614174014',
  },
  {
    id: '34567890-bcde-f012-7890-123456789012',
    name: 'DevOps',
    description: 'Practices for integrating development and operations.',
    createdAt: '2025-08-07T10:15:00.000Z',
    updatedAt: '2025-08-07T10:15:00.000Z',
    userId: 'g23e4567-e89b-12d3-a456-426614174015',
  },
  {
    id: '45678901-cdef-0123-8901-234567890123',
    name: 'Computer Graphics',
    description: 'An introduction to computer graphics and visualization.',
    createdAt: '2025-08-07T10:20:00.000Z',
    updatedAt: '2025-08-07T10:20:00.000Z',
    userId: 'h23e4567-e89b-12d3-a456-426614174016',
  },
  {
    id: '56789012-def0-1234-9012-345678901234',
    name: 'Parallel Computing',
    description: 'Exploring parallel computing and distributed systems.',
    createdAt: '2025-08-07T10:25:00.000Z',
    updatedAt: '2025-08-07T10:25:00.000Z',
    userId: 'i23e4567-e89b-12d3-a456-426614174017',
  },
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('query')?.toLowerCase() || '';

  const filteredTopics = query
    ? topics_data.filter(
        (topic) =>
          topic.name.toLowerCase().includes(query) ||
          topic.description.toLowerCase().includes(query)
      )
    : topics_data;

  return NextResponse.json(filteredTopics);
}

export async function POST(request: Request) {
  const newTopic = await request.json();
  const topicToAdd = {
    ...newTopic,
    id: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  console.log(topicToAdd);
  const parsedResult = TopicSchema.safeParse(topicToAdd);
  if (!parsedResult.success) {
    return NextResponse.json(
      { error: 'Invalid topic data', issues: parsedResult.error.issues },
      { status: 400 }
    );
  }
  topics_data.push(topicToAdd);

  return NextResponse.json(topicToAdd);
}
