/**
 * EIP5792Methods
 */
export const EIP5792_METHODS = {
  WALLET_GET_CAPABILITIES: 'wallet_getCapabilities',
  WALLET_SEND_CALLS: 'wallet_sendCalls',
  WALLET_SHOW_CALLS_STATUS: 'wallet_showCallsStatus',
  WALLET_GET_CALLS_STATUS: 'wallet_getCallsStatus'
}

// capability names as string literals
export type CapabilityName = 'atomicBatch' | 'paymasterService' | 'sessionKey'
// Capability type where each key is a capability name and value has `supported` field
export type Capabilities = {
  [K in CapabilityName]?: {
    supported: boolean
  }
}
// GetCapabilitiesResult type using mapped types
export type GetCapabilitiesResult = Record<string, Capabilities>

export type GetCallsParams = string
export type ShowCallsParams = string

export type SendCallsParams = {
  version: string
  chainId: `0x${string}` // Hex chain id
  from: `0x${string}`
  calls: {
    to: `0x${string}`
    data?: `0x${string}` | undefined
    value?: `0x${string}` | undefined // Hex value
  }[]
  capabilities?: Record<string, any> | undefined
}
export type SendCallsPaymasterServiceCapabilityParam = {
  url: string
  context: Record<string, any> | undefined
}

export type GetCallsResult = {
  status: 'PENDING' | 'CONFIRMED'
  receipts?: {
    logs: {
      address: `0x${string}`
      data: `0x${string}`
      topics: `0x${string}`[]
    }[]
    status: `0x${string}` // Hex 1 or 0 for success or failure, respectively
    blockHash: `0x${string}`
    blockNumber: `0x${string}`
    gasUsed: `0x${string}`
    transactionHash: `0x${string}`
  }[]
}

// supportedEIP5792Capabilities object
export const supportedEIP5792CapabilitiesForEOA: GetCapabilitiesResult = {
  // Not supporting any capabilities for now on EOA account
}
// supportedEIP5792Capabilities object
export const supportedEIP5792CapabilitiesForSCA: GetCapabilitiesResult = {
  //Ethereum Sepolia
  '0xaa36a7': {
    paymasterService: {
      supported: true
    },
    // sessionKey: {
    //   supported: true,
    // },
    atomicBatch: {
      supported: true
    }
  }
}
