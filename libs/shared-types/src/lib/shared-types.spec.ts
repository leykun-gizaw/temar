import type { NotionPage } from './shared-types.js';

describe('sharedTypes', () => {
  it('should export NotionPage type', () => {
    const page: Partial<NotionPage> = {};
    expect(page).toBeDefined();
  });
});
