import * as chains from 'viem/chains'
import { Chain } from 'viem/chains'

export function getChainById(chainId: number): Chain {
  for (const chain of Object.values(chains)) {
    if (chain.id === chainId) {
      return chain
    }
  }

  throw new Error(`Chain with id ${chainId} not found`)
}
