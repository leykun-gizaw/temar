import { NextResponse } from 'next/server';
import { findTopicById } from '../data';

export async function GET(
  _request: Request,
  { params }: { params: { topicId: string } }
) {
  const topic = findTopicById(params.topicId);
  if (!topic) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(topic);
}
