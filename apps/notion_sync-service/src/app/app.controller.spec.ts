import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { NotionAuthService } from './services/notion-auth.service';
import { NotionApiService } from './services/notion-api.service';
import { NotionContentService } from './services/notion-content.service';
import { UserRepository } from './services/user.repository';

describe('AppController', () => {
  let controller: AppController;

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        NotionAuthService,
        NotionApiService,
        NotionContentService,
        UserRepository,
      ],
    }).compile();

    controller = app.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
