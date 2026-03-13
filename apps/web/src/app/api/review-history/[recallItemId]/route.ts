import { NextRequest, NextResponse } from 'next/server';
import { getReviewHistory } from '@/lib/fetchers/recall-items';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ recallItemId: string }> }
) {
  const { recallItemId } = await params;

  try {
    const logs = await getReviewHistory(recallItemId);
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to fetch review history:', error);
    return NextResponse.json([], { status: 500 });
  }
}
