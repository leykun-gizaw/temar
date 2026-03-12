'use server';

import { getLoggedInUser } from '@/lib/fetchers/users';
import { getUserAiConfig } from './ai-settings';
import { analysisServiceFetch } from '../answer-analysis-service';
import { checkAndDeductPass } from './pass';
import { estimateInputTokens } from '@/lib/config/ai-operations';
import type { AiProvider } from '@/lib/config/ai-operations';

async function getAiHeaders(): Promise<Record<string, string>> {
  const config = await getUserAiConfig();
  if (!config) return {};
  return {
    ...(config.provider && { 'x-ai-provider': config.provider }),
    ...(config.model && { 'x-ai-model': config.model }),
    ...(config.apiKey && { 'x-ai-api-key': config.apiKey }),
  };
}

export interface AnalysisResult {
  scorePercent: number;
  strengths: string[];
  weaknesses: string[];
  reasoning: string;
  suggestedRating: number;
  suggestedLabel: 'Again' | 'Hard' | 'Good' | 'Easy';
}

export type AnalyzeAnswerResult =
  | { status: 'success'; data: AnalysisResult; passDeducted: number }
  | {
      status: 'consent_required';
      estimatedPassCost: number;
      basePassCost: number;
    }
  | { status: 'insufficient_pass'; balance: number; required: number }
  | { status: 'error'; message: string };

export async function analyzeAnswer(
  answer: string,
  questionTitle: string,
  questionText: string,
  criteria: string[],
  keyPoints: string[],
  consentedPassCost?: number
): Promise<AnalyzeAnswerResult> {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) return { status: 'error', message: 'User not logged in' };

  const aiConfig = await getUserAiConfig();
  const provider = (aiConfig?.provider ?? 'google') as AiProvider;
  const modelId = aiConfig?.model ?? 'gemini-2.0-flash';

  const inputText = [
    answer,
    questionTitle,
    questionText,
    ...criteria,
    ...keyPoints,
  ].join(' ');
  const estimatedTokens = estimateInputTokens(inputText, provider);

  const passResult = await checkAndDeductPass(
    'answer_analysis',
    modelId,
    inputText,
    provider,
    consentedPassCost
  );

  if (passResult.status !== 'ok') {
    return passResult as AnalyzeAnswerResult;
  }

  const aiHeaders = await getAiHeaders();

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
    return { status: 'success', data, passDeducted: passResult.passDeducted };
  } catch (err) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Analysis failed',
    };
  }
}
