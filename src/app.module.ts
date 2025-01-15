import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ModeBotModule } from './mode-bot/mode-bot.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [ModeBotModule, DatabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
