import { Web3Wallet, IWeb3Wallet } from '@walletconnect/web3wallet'
import { Core } from '@walletconnect/core'
export let web3wallet: IWeb3Wallet

export async function createWeb3Wallet(relayerRegionURL: string) {
  const core = new Core({
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
    relayUrl: relayerRegionURL ?? process.env.NEXT_PUBLIC_RELAY_URL,
    logger: 'error'
  })
  web3wallet = await Web3Wallet.init({
    core,
    metadata: {
      name: 'React Wallet Example',
      description: 'React Wallet for WalletConnect',
      url: 'https://walletconnect.com/',
      icons: ['https://avatars.githubusercontent.com/u/37784886']
    },
    signConfig: {
      disableRequestQueue: true
    }
  })

  try {
    const clientId = await web3wallet.engine.signClient.core.crypto.getClientId()
    console.log('WalletConnect ClientID: ', clientId)
    localStorage.setItem('WALLETCONNECT_CLIENT_ID', clientId)
  } catch (error) {
    console.error('Failed to set WalletConnect clientId in localStorage: ', error)
  }
}

export async function updateSignClientChainId(chainId: string, address: string) {
  console.log('chainId', chainId, address)
  // get most recent session
  const sessions = web3wallet.getActiveSessions()
  if (!sessions) return
  const namespace = chainId.split(':')[0]
  Object.values(sessions).forEach(async session => {
    await web3wallet.updateSession({
      topic: session.topic,
      namespaces: {
        ...session.namespaces,
        [namespace]: {
          ...session.namespaces[namespace],
          chains: [
            ...new Set([chainId].concat(Array.from(session?.namespaces?.[namespace]?.chains || [])))
          ],
          accounts: [
            ...new Set(
              [`${chainId}:${address}`].concat(
                Array.from(session?.namespaces?.[namespace]?.accounts || [])
              )
            )
          ]
        }
      }
    })
    await new Promise(resolve => setTimeout(resolve, 1000))

    const chainChanged = {
      topic: session.topic,
      event: {
        name: 'chainChanged',
        data: parseInt(chainId.split(':')[1])
      },
      chainId: chainId
    }

    const accountsChanged = {
      topic: session.topic,
      event: {
        name: 'accountsChanged',
        data: [`${chainId}:${address}`]
      },
      chainId
    }
    await web3wallet.emitSessionEvent(chainChanged)
    await web3wallet.emitSessionEvent(accountsChanged)
  })
}
