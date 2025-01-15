import { Module } from '@nestjs/common';
import { ModeBotService } from './mode-bot.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [ModeBotService],
})
export class ModeBotModule {}
