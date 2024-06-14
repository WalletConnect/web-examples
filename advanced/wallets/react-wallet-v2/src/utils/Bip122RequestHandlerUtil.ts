import { KADENA_SIGNING_METHODS } from '@/data/KadenaData'
import { formatJsonRpcError, formatJsonRpcResult } from '@json-rpc-tools/utils'
import { SignClientTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import { getWalletAddressFromParams } from './HelperUtil'
import { BIP122_SIGNING_METHODS } from '@/data/Bip122Data'
import { bip122Addresses, bip122Wallets } from './Bip122WalletUtil'

export async function approveBip122Request(
  requestEvent: SignClientTypes.EventArguments['session_request']
) {
  const { params, id } = requestEvent
  const { request } = params
  const account = request.params?.address || request.params[1]
  const wallet = bip122Wallets[account]
  console.log('wallet:', wallet, bip122Wallets)
  console.log('account:', account)
  switch (request.method) {
    case BIP122_SIGNING_METHODS.BIP122_SIGN_MESSAGE:
      const message = request.params[0]
      console.log('signing message:', message, 'with account:', account)
      const signature = wallet.signMessage(message)
      return formatJsonRpcResult(id, signature)
    case BIP122_SIGNING_METHODS.BIP122_SEND_TRANSACTION:
      const transactionParams = request.params as {
        address: string
        value: number
        transactionType: string
      }
      console.log('signing transaction:', transactionParams, 'with account:', account)
      const signedTransaction = await wallet.signTransaction({
        address: transactionParams.address,
        amount: transactionParams.value,
        transactionType: transactionParams.transactionType
      })
      return formatJsonRpcResult(id, signedTransaction)
    default:
      throw new Error(getSdkError('UNSUPPORTED_METHODS').message)
  }
}

export function rejectBip122Request(request: SignClientTypes.EventArguments['session_request']) {
  const { id } = request

  return formatJsonRpcError(id, getSdkError('USER_REJECTED_METHODS').message)
}
