import { NextRequest, NextResponse } from 'next/server';
import { dbClient, recallItem, eq, and } from '@temar/db-client';
import { getLoggedInUser } from '@/lib/fetchers/users';

export interface ChunkRecallStats {
  totalQuestions: number;
  dueCount: number;
  totalReps: number;
  totalLapses: number;
  avgStability: number;
  avgDifficulty: number;
  lastReview: string | null;
  stateDistribution: Record<number, number>;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ chunkId: string }> }
) {
  const { chunkId } = await params;

  try {
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json(null, { status: 401 });
    }

    const items = await dbClient
      .select({
        state: recallItem.state,
        due: recallItem.due,
        stability: recallItem.stability,
        difficulty: recallItem.difficulty,
        reps: recallItem.reps,
        lapses: recallItem.lapses,
        lastReview: recallItem.lastReview,
      })
      .from(recallItem)
      .where(
        and(eq(recallItem.chunkId, chunkId), eq(recallItem.userId, user.id))
      );

    if (items.length === 0) {
      return NextResponse.json(null);
    }

    const now = new Date();
    const stats: ChunkRecallStats = {
      totalQuestions: items.length,
      dueCount: items.filter((i) => new Date(i.due) <= now).length,
      totalReps: items.reduce((s, i) => s + i.reps, 0),
      totalLapses: items.reduce((s, i) => s + i.lapses, 0),
      avgStability:
        items.reduce((s, i) => s + i.stability, 0) / items.length,
      avgDifficulty:
        items.reduce((s, i) => s + i.difficulty, 0) / items.length,
      lastReview: items
        .map((i) => i.lastReview)
        .filter(Boolean)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0]
        ?.toISOString() ?? null,
      stateDistribution: items.reduce(
        (acc, i) => {
          acc[i.state] = (acc[i.state] ?? 0) + 1;
          return acc;
        },
        {} as Record<number, number>
      ),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch chunk recall stats:', error);
    return NextResponse.json(null, { status: 500 });
  }
}
