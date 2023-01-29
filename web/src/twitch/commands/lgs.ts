import { t } from 'i18next'

import { prisma } from '../../db/prisma.js'
import { DBSettings } from '../../db/settings.js'
import { chatClient } from '../index.js'
import commandHandler, { MessageType } from '../lib/CommandHandler.js'

commandHandler.registerCommand('lgs', {
  aliases: ['lastgamescore', 'lgscore', 'lgwl'],
  onlyOnline: true,
  dbkey: DBSettings.commandLG,
  handler: (message: MessageType, args: string[]) => {
    if (!message.channel.client.steam32Id) {
      void chatClient.say(
        message.channel.name,
        t('unknownSteam', { lng: message.channel.client.locale }),
      )
      return
    }

    const { steam32Id } = message.channel.client
    async function handler() {
      const lg = await prisma.bet.findFirst({
        where: {
          steam32Id: steam32Id,
          won: {
            not: null,
          },
        },
        select: {
          won: true,
          is_party: true,
          is_doubledown: true,
          matchId: true,
          kda: true,
          lobby_type: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      if (!lg) {
        void chatClient.say(
          message.channel.name,
          t('noLastMatch', { lng: message.channel.client.locale }),
        )
        return
      }

      const returnMsg = []

      returnMsg.push(
        lg.won
          ? t('lastgamescore.won', { lng: message.channel.client.locale })
          : t('lastgamescore.lost', { lng: message.channel.client.locale }),
      )

      const kda = lg.kda as {
        kills: number | null
        deaths: number | null
        assists: number | null
      } | null
      if (kda) {
        const kdaMsg = `${kda.kills ?? 0}/${kda.deaths ?? 0}/${kda.assists ?? 0}`
        returnMsg.push(
          t('lastgamescore.kda', {
            lng: message.channel.client.locale,
            kdavalue: kdaMsg,
          }),
        )
      }

      // calculate the time difference in minutes between createdAt and updatedAt
      const lasted = Math.floor((lg.updatedAt.getTime() - lg.createdAt.getTime()) / 1000 / 60)

      returnMsg.push(
        t('lastgamescore.duration', { minutes: lasted, lng: message.channel.client.locale }),
      )

      const endedMinutes = Math.floor((Date.now() - lg.updatedAt.getTime()) / (1000 * 60))
      const minutes = endedMinutes % 60
      const hours = Math.floor(endedMinutes / 60) % 24
      const days = Math.floor(endedMinutes / (60 * 24)) % 7
      const weeks = Math.floor(endedMinutes / (60 * 24 * 7))

      const times = []
      if (weeks > 0) {
        times.push(`${weeks}${t('time.week', { lng: message.channel.client.locale })}`)
      }

      if (days > 0) {
        times.push(`${days}${t('time.day', { lng: message.channel.client.locale })}`)
      }

      if (hours > 0) {
        times.push(`${hours}${t('time.hour', { lng: message.channel.client.locale })}`)
      }

      if (minutes > 0) {
        times.push(`${minutes}${t('time.minute', { lng: message.channel.client.locale })}`)
      }

      returnMsg.push(
        t('lastgamescore.ended', {
          timeAgo: times.join(' '),
          lng: message.channel.client.locale,
        }),
      )

      if (lg.is_party)
        returnMsg.push(t('lastgamescore.party', { lng: message.channel.client.locale }))
      if (lg.is_doubledown)
        returnMsg.push(t('lastgamescore.double', { lng: message.channel.client.locale }))
      if (lg.lobby_type !== 7)
        returnMsg.push(t('lastgamescore.unranked', { lng: message.channel.client.locale }))
      returnMsg.push(`dotabuff.com/matches/${lg.matchId}`)

      void chatClient.say(message.channel.name, returnMsg.join(' · '))
    }

    void handler()
  },
})
