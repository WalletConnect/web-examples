import BitcoinLib from '@/lib/Bip122Lib'

export let wallet1: BitcoinLib
export let wallet2: BitcoinLib
export let bip122Wallets: Record<string, BitcoinLib>
export let bip122Addresses: string[]

let address1: string
let address2: string

/**
 * Utilities
 */
export async function createOrRestoreBip122Wallet() {
  const privateKey1 = localStorage.getItem('BITCOIN_PRIVATE_KEY_1')
  const privateKey2 = localStorage.getItem('BITCOIN_PRIVATE_KEY_2')

  if (privateKey1) {
    wallet1 = await BitcoinLib.init({ privateKey: privateKey1 })
    // wallet2 = await BitcoinLib.init({ privateKey: privateKey2 })
  } else {
    wallet1 = await BitcoinLib.init({})
    // wallet2 = await BitcoinLib.init({})

    // Don't store private keys in local storage in a production project!
    localStorage.setItem('BITCOIN_PRIVATE_KEY_1', wallet1.getPrivateKey())
    // localStorage.setItem('BITCOIN_PRIVATE_KEY_2', wallet2.getPrivateKey())
  }

  address1 = await wallet1.getAddress()
  console.log('address1', { address1, privateKey1 }, address1)
  // address2 = await wallet2.getAddress()

  bip122Wallets = {
    [address1]: wallet1
    // [address2]: wallet2
  }
  bip122Addresses = Object.keys(bip122Wallets)

  return {
    bip122Wallets,
    bip122Addresses
  }
}
