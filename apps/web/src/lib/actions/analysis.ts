'use server';

import { getLoggedInUser } from '@/lib/fetchers/users';
import { getUserAiConfig, getAiSettings } from './ai-settings';
import { getAiHeaders } from './ai-headers';
import { analysisServiceFetch } from '../answer-analysis-service';
import { checkPassAvailability } from './pass';
import { estimateInputTokens } from '@/lib/config/ai-operations';
import { pgNotify } from '@temar/db-client';
import type { AiProvider } from '@/lib/config/ai-operations';

export interface AnalysisResult {
  scorePercent: number;
  strengths: string[];
  weaknesses: string[];
  reasoning: string;
  suggestedRating: number;
  suggestedLabel: 'Again' | 'Hard' | 'Good' | 'Easy';
}

export type AnalyzeAnswerResult =
  | {
      status: 'success';
      data: AnalysisResult;
      passDeducted: number;
    }
  | { status: 'analyzing'; requestId: string }
  | { status: 'insufficient_pass'; balance: number; required: number }
  | { status: 'error'; message: string };

export async function analyzeAnswer(
  answer: string,
  questionTitle: string,
  questionText: string,
  criteria: string[],
  keyPoints: string[]
): Promise<AnalyzeAnswerResult> {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) return { status: 'error', message: 'User not logged in' };

  const aiConfig = await getUserAiConfig();
  const settings = await getAiSettings();
  const provider = (aiConfig?.provider ?? settings.provider ?? 'google') as AiProvider;

  const inputText = [
    answer,
    questionTitle,
    questionText,
    ...criteria,
    ...keyPoints,
  ].join(' ');
  const estimatedTokens = estimateInputTokens(inputText, provider);

  // Step 1: Check if user can afford this operation (no deduction yet)
  const passCheck = await checkPassAvailability('answer_analysis');

  if (passCheck.status !== 'ok') {
    return passCheck as AnalyzeAnswerResult;
  }

  const aiHeaders = await getAiHeaders();
  const requestId = crypto.randomUUID();

  // Fire-and-forget: run analysis in the background.
  // The result is pushed to the client via SSE (pg_notify → EventSource).
  void (async () => {
    try {
      const data = await analysisServiceFetch<AnalysisResult>('analyze', {
        method: 'POST',
        userId: loggedInUser.id,
        headers: aiHeaders,
        body: {
          answer,
          questionTitle,
          questionText,
          criteria,
          keyPoints,
          maxOutputTokens: 1000,
          _estimatedTokens: estimatedTokens,
        },
      });

      await pgNotify(loggedInUser.id, {
        type: 'analysis:complete',
        requestId,
        status: 'success',
        data,
        passDeducted: passCheck.passToDeduct,
      });
    } catch (err) {
      await pgNotify(loggedInUser.id, {
        type: 'analysis:complete',
        requestId,
        status: 'error',
        message: err instanceof Error ? err.message : 'Analysis failed',
      }).catch(() => { /* noop */ });
    }
  })();

  return { status: 'analyzing', requestId };
}
