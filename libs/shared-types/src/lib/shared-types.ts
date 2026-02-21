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

export const questionSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe('A self-contained recall question'),
      rubric: z.object({
        criteria: z
          .array(z.string())
          .describe('Evaluation criteria for grading the answer'),
        keyPoints: z
          .array(z.string())
          .describe('Key points the answer must cover'),
      }),
    })
  ),
});

export type GeneratedQuestion = z.infer<
  typeof questionSchema
>['questions'][number];
