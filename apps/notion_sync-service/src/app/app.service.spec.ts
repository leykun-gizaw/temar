import { Test } from '@nestjs/testing';
import { NotionAuthService } from './services/notion-auth.service';
import { NotionApiService } from './services/notion-api.service';
import { NotionContentService } from './services/notion-content.service';
import { UserRepository } from './services/user.repository';

describe('Services', () => {
  let notionAuth: NotionAuthService;
  let notionApi: NotionApiService;
  let notionContent: NotionContentService;
  let userRepository: UserRepository;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [
        NotionAuthService,
        NotionApiService,
        NotionContentService,
        UserRepository,
      ],
    }).compile();

    notionAuth = app.get<NotionAuthService>(NotionAuthService);
    notionApi = app.get<NotionApiService>(NotionApiService);
    notionContent = app.get<NotionContentService>(NotionContentService);
    userRepository = app.get<UserRepository>(UserRepository);
  });

  it('should resolve all services', () => {
    expect(notionAuth).toBeDefined();
    expect(notionApi).toBeDefined();
    expect(notionContent).toBeDefined();
    expect(userRepository).toBeDefined();
  });
});
