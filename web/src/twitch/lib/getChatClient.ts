import { ChatClient } from '@twurple/chat'

import { getAuthProvider } from './getAuthProvider.js'

export function getChatClient() {
  const chatClient = new ChatClient({
    isAlwaysMod: true,
    authProvider: getAuthProvider(),
  })

  // await chatClient.connect()
  console.log('[TWITCHSETUP]', 'Connected to chat client', chatClient.isConnected)

  return chatClient
}
