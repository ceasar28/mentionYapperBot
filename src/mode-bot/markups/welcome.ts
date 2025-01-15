export const welcomeMessageMarkup = async (userName: string) => {
  return {
    message: `Hi @${userName},\n\nWelcome to modemind Bot.`,

    keyboard: [
      [
        {
          text: 'Lets get started 🚀',
          callback_data: JSON.stringify({
            command: '/menu',
            language: 'english',
          }),
        },
      ],
    ],
  };
};
