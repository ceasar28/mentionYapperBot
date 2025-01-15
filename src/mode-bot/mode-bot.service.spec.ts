import { Test, TestingModule } from '@nestjs/testing';
import { ModeBotService } from './mode-bot.service';

describe('ModeBotService', () => {
  let service: ModeBotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModeBotService],
    }).compile();

    service = module.get<ModeBotService>(ModeBotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
