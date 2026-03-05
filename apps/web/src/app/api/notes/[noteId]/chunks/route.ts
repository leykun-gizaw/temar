import { NextRequest, NextResponse } from 'next/server';
import { getFilteredChunks } from '@/lib/fetchers/chunks';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const { noteId } = await params;

  try {
    const chunks = await getFilteredChunks('', noteId);
    return NextResponse.json(chunks);
  } catch (error) {
    console.error('Failed to fetch chunks:', error);
    return NextResponse.json([], { status: 500 });
  }
}
