import { PageObjectResponse } from '@notionhq/client/';

type NotionProperties = PageObjectResponse['properties'];
type NotionParent = PageObjectResponse['parent'];
type NameProperty = Extract<NotionProperties[string], { type: 'title' }>;
type DescriptionProperty = Extract<
  NotionProperties[string],
  { type: 'rich_text' }
>;
type ParentProperty = Extract<NotionParent, { type: 'data_source_id' }>;

export interface NotionPage extends PageObjectResponse {
  properties: {
    Name: NameProperty;
    Description: DescriptionProperty;
  };
  parent: ParentProperty;
}
