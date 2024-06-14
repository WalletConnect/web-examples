/**
 * Chains
 */
export const BITCOIN_MAINNET = {
  'bip122:000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f': {
    chainId: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
    name: 'BTC Mainnet',
    logo: '/chain-logos/btc-mainnet.png',
    rgb: '107, 111, 147',
    rpc: '',
    namespace: 'bip122'
  }
}
export const BITCOIN_TESTNET = {
  'bip122:000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943': {
    chainId: '000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943',
    name: 'BTC Signet',
    logo: '/chain-logos/btc-testnet.png',
    rgb: '247, 147, 25',
    rpc: '',
    namespace: 'bip122'
  }
}

export const BIP122_CHAINS = { ...BITCOIN_TESTNET }

/**
 * Methods
 */
export const BIP122_SIGNING_METHODS = {
  BIP122_SIGN_MESSAGE: 'btc_signMessage',
  BIP122_SEND_TRANSACTION: 'btc_sendTransaction'
}
