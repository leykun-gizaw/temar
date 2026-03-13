import { PageObjectResponse } from '@notionhq/client/';
import { z } from 'zod';

type NotionProperties = PageObjectResponse['properties'];
type NotionParent = PageObjectResponse['parent'];
type NameProperty = Extract<NotionProperties[string], { type: 'title' }>;
type DescriptionProperty = Extract<
  NotionProperties[string],
  { type: 'rich_text' }
>;
type DataSourceParent = Extract<NotionParent, { type: 'data_source_id' }>;
type DatabaseParent = Extract<NotionParent, { type: 'database_id' }>;
type PageParent = Extract<NotionParent, { type: 'page_id' }>;

export interface NotionPage extends PageObjectResponse {
  properties: {
    Name: NameProperty;
    Description: DescriptionProperty;
  };
  parent: DataSourceParent | DatabaseParent | PageParent;
}

export const questionTypeEnum = z.enum(['mcq', 'open_ended', 'leetcode']);
export type QuestionType = z.infer<typeof questionTypeEnum>;

export const questionSchema = z.object({
  questions: z.array(
    z.object({
      title: z
        .string()
        .describe('Short descriptive title for the question (3-8 words)'),
      question: z.string().describe('A self-contained recall question'),
      questionType: questionTypeEnum.describe(
        'The type of question: mcq, open_ended, or leetcode',
      ),
      rubric: z.object({
        criteria: z
          .array(z.string())
          .describe('Evaluation criteria for grading the answer'),
        keyPoints: z
          .array(z.string())
          .describe('Key points the answer must cover'),
      }),
    }),
  ),
});

export type GeneratedQuestion = z.infer<
  typeof questionSchema
>['questions'][number];

export const answerAnalysisSchema = z.object({
  scorePercent: z
    .number()
    .min(0)
    .max(100)
    .describe('Overall score as a percentage (0-100)'),
  strengths: z
    .array(z.string())
    .describe('Specific strengths identified in the answer'),
  weaknesses: z
    .array(z.string())
    .describe('Specific weaknesses or missing elements in the answer'),
  reasoning: z.string().describe('Brief explanation of the overall assessment'),
});

export type AnswerAnalysisResult = z.infer<typeof answerAnalysisSchema> & {
  suggestedRating: number;
  suggestedLabel: 'Again' | 'Hard' | 'Good' | 'Easy';
};
