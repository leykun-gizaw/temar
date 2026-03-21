import { NextRequest, NextResponse } from 'next/server';
import { getReviewLogs } from '@/lib/fetchers/recall-items';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json(
      { error: 'from and to query params required' },
      { status: 400 }
    );
  }

  const logs = await getReviewLogs(new Date(from), new Date(to));
  return NextResponse.json(logs);
}
