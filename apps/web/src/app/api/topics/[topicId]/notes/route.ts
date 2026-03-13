import { NextRequest, NextResponse } from 'next/server';
import { getFilteredNotes } from '@/lib/fetchers/notes';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const { topicId } = await params;

  try {
    const notes = await getFilteredNotes('', topicId);
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    return NextResponse.json([], { status: 500 });
  }
}
