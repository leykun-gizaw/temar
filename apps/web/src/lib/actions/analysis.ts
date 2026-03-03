'use server';

import { getLoggedInUser } from '@/lib/fetchers/users';
import { getUserAiConfig } from './ai-settings';
import { analysisServiceFetch } from '../answer-analysis-service';

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

export async function analyzeAnswer(
  answer: string,
  questionTitle: string,
  questionText: string,
  criteria: string[],
  keyPoints: string[]
): Promise<AnalysisResult> {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const aiHeaders = await getAiHeaders();

  return analysisServiceFetch<AnalysisResult>('analyze', {
    method: 'POST',
    userId: loggedInUser.id,
    headers: aiHeaders,
    body: {
      answer,
      questionTitle,
      questionText,
      criteria,
      keyPoints,
    },
  });
}
