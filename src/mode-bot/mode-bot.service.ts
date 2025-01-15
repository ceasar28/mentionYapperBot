import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { welcomeMessageMarkup } from './markups';
import OpenAI from 'openai';
import { User } from './schemas/user.schema';
import * as dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_TOKEN;

@Injectable()
export class ModeBotService {
  private readonly bot: TelegramBot;
  private logger = new Logger(ModeBotService.name);
  private readonly openai: OpenAI;

  constructor(@InjectModel(User.name) private readonly UserModel: Model<User>) {
    this.bot = new TelegramBot(token, { polling: true });
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // This is the default and can be omitted
    });
    this.bot.on('message', this.handleRecievedMessages);
  }

  handleRecievedMessages = async (msg: any) => {
    this.logger.debug(msg);
    try {
      await this.bot.sendChatAction(msg.chat.id, 'typing');

      if (!msg.text) {
        return;
      }

      const command = msg.text.trim();

      if (command.startsWith('/start')) {
        const username = `${msg.from.username}`;
        const userExist = await this.UserModel.findOne({
          chatId: msg.chat.id,
        });
        if (userExist) {
          const welcome = await welcomeMessageMarkup(username);
          const replyMarkup = {
            inline_keyboard: welcome.keyboard,
          };
          return await this.bot.sendMessage(msg.chat.id, welcome.message, {
            reply_markup: replyMarkup,
          });
        }

        // save users to db
        const saved = await this.saveUserToDB(username, msg.chat.id);

        const welcome = await welcomeMessageMarkup(username);

        if (welcome && saved) {
          const replyMarkup = {
            inline_keyboard: welcome.keyboard,
          };
          await this.bot.sendMessage(msg.chat.id, welcome.message, {
            reply_markup: replyMarkup,
          });
        } else {
          await this.bot.sendMessage(
            msg.chat.id,
            'There was an error saving your data, Please click the button below to try again.\n\nclick on /start or retry with the refferal link',
          );
        }
      } else if (command.includes('@CryptoFede') && msg.chat.type === 'group') {
        await this.handleGroupTag(msg);
      }
    } catch (error) {
      console.error(error);
    }
  };

  saveUserToDB = async (username: string, chat_id: number, count?: number) => {
    try {
      const saveUser = new this.UserModel({
        userName: username,
        chatId: chat_id,
        count: count || 0,
      });

      return await saveUser.save();
    } catch (error) {
      console.log(error);
    }
  };

  private handleGroupTag = async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const username = msg.from?.username || 'Unknown User';
    const userChatId = msg.from?.id;
    try {
      const userExist = await this.UserModel.findOne({ chatId: userChatId });

      if (!userExist) {
        const saveUser = await this.saveUserToDB(username, userChatId, 1);

        const data = { username: saveUser.userName, count: saveUser.count };

        const yapperReply = await this.yapper(data);

        await this.bot.sendMessage(chatId, `${yapperReply.reply}`);
      }
      // Log the sender's information
      // this.logger.debug(
      //   `@CryptoFede tagged by ${username} in group ${chatId}`,
      // );

      const editUserCount = await this.UserModel.findOneAndUpdate(
        { chatId: userChatId },
        { $inc: { count: 1 } }, // Increment count by 1
        { new: true }, // Return the updated document
      );

      const data = {
        username: editUserCount.userName,
        count: editUserCount.count,
      };

      const yapperReply = await this.yapper(data);

      await this.bot.sendMessage(chatId, `${yapperReply.reply}`);
    } catch (error) {
      console.log(error);
    }
  };

  private yapper = async (data: any) => {
    const username = data.username;
    const mentionsByUser = data.count;
    const totalMentions = await this.sumAllCounts();

    const prompt = `In this Telegram group chat, @${username} mentioned @CryptoFede. They've mentioned @CryptoFede **${mentionsByUser} times**. The total mentions of @CryptoFede from everyone in the group is **${totalMentions}**. Provide a witty, fun, sarcastic, and playful reply detailing these statistics. Show the numbers, not percentages, and keep it lighthearted, with a hint of mockery about how often @${username} mentions @CryptoFede . Respond as if you're a Telegram bot joining the conversation with some cheeky humor!`;

    try {
      const response = await this.openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `Act as a witty AI agent. Reply with a fun and sarcastic comment detailing the mention statistics using numbers. Show the frequency @${username} mentioned @CryptoFede and the total number of time everyother person mentioned @CryptoFede , in a playful tone. Keep the response light and humorous, without percentages, using only raw numbers.let the reply be maximum of 100 characters`,
          },
          { role: 'user', content: prompt },
        ],
        model: 'gpt-4o-mini',
      });

      const reply =
        response.choices[0].message?.content.trim() ||
        'No witty reply this time!';
      return { reply };
    } catch (error) {
      this.logger.error('Error generating reply:', error.message);
      return { reply: `Oops,I don't have a witty response this time around.` };
    }
  };

  async sumAllCounts(): Promise<number> {
    try {
      const result = await this.UserModel.aggregate([
        {
          $group: {
            _id: null, // No grouping key, so it sums all documents
            totalCount: { $sum: '$count' }, // Sum all `count` fields
          },
        },
      ]);

      // If no documents exist, return 0
      return result.length > 0 ? result[0].totalCount : 0;
    } catch (error) {
      console.error('Error calculating total count:', error);
      throw new Error('Could not calculate total count');
    }
  }
}
