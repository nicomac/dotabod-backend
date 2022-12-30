import { t } from 'i18next'

import { DBSettings } from '../../db/settings.js'
import { chatClient } from '../index.js'
import commandHandler, { MessageType } from '../lib/CommandHandler.js'

commandHandler.registerCommand('dotabuff', {
  dbkey: DBSettings.commandDotabuff,
  handler: (message: MessageType, args: string[]) => {
    const {
      channel: { name: channel, client },
    } = message

    if (client.steam32Id && Number(client.steam32Id)) {
      void chatClient.say(
        channel,
        t('profileUrl', {
          channel: client.name,
          lng: message.channel.client.locale,
          url: `dotabuff.com/players/${client.steam32Id.toString()}`,
        }),
      )
      return
    }

    void chatClient.say(channel, t('unknownSteam', { lng: message.channel.client.locale }))
  },
})
