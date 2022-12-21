import { ChatClient } from '@twurple/chat'
import retry from 'retry'

import { getAuthProvider } from './getAuthProvider.js'

class ChatClientSingleton {
  static instance: ChatClient | null = null

  static async getInstance() {
    if (ChatClientSingleton.instance) {
      return ChatClientSingleton.instance
    }

    const chatClient = new ChatClient({
      isAlwaysMod: true,
      authProvider: getAuthProvider(),
    })

    const operation = retry.operation({
      retries: 5,
      factor: 3,
      minTimeout: 1 * 1000,
      maxTimeout: 60 * 1000,
    })

    await new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      operation.attempt(async (currentAttempt) => {
        try {
          await chatClient.connect()
          resolve(chatClient)
        } catch (e: any) {
          console.log(
            `[TWITCHSETUP] Error connecting to chat client on attempt ${currentAttempt}: ${e}`,
          )
          if (!operation.retry(e)) {
            reject(e)
          }
        }
      })
    })

    console.log('[TWITCHSETUP]', 'Connected to chat client', chatClient.isConnected)

    ChatClientSingleton.instance = chatClient

    return chatClient
  }
}

export default ChatClientSingleton
