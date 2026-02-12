import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
  });

  describe('getGreeting', () => {
    it('should return "Hello API"', async () => {
      const appController = app.get<AppController>(AppController);
      expect(await appController.getGreeting()).toEqual({
        message: 'Hello API',
      });
    });
  });
});
