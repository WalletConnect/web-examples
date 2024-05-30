import { eip155Addresses } from './EIP155WalletUtil'
import {
  GetCapabilitiesResult,
  SendCallsParams,
  supportedEIP5792CapabilitiesForEOA,
  supportedEIP5792CapabilitiesForSCA
} from '@/data/EIP5792Data'

export function getWalletCapabilities(addresses: string[]) {
  const walletCapabilities: GetCapabilitiesResult = {}
  addresses.forEach(address => {
    const namespacesAddress = address.split(':')
    // address will be the last index element whether
    // its a simple address or namespace:chainId:address
    const addr = namespacesAddress[namespacesAddress.length - 1]
    if (eip155Addresses.includes(addr)) {
      // no capabilities support for EOA for now.
      return
    }
    walletCapabilities[addr] = supportedEIP5792CapabilitiesForSCA
  })
  return walletCapabilities
}

export const getSendCallData = (sendCallParams: SendCallsParams) => {
  return sendCallParams.calls.map(call => ({
    to: call.to,
    value: BigInt(call.value || 0),
    data: call.data || '0x'
  }))
}
