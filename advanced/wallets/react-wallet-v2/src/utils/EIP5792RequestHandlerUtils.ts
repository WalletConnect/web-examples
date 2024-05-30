import { EIP155_CHAINS, TEIP155Chain } from '@/data/EIP155Data'
import {
  EIP5792_METHODS,
  GetCallsParams,
  GetCallsResult,
  GetCapabilitiesResult,
  SendCallsParams,
  supportedEIP5792CapabilitiesForEOA,
  supportedEIP5792CapabilitiesForSCA
} from '@/data/EIP5792Data'
import { getWallet } from '@/utils/EIP155WalletUtil'
import { formatJsonRpcError, formatJsonRpcResult } from '@json-rpc-tools/utils'
import { SignClientTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import SettingsStore from '@/store/SettingsStore'
import EIP155Lib from '@/lib/EIP155Lib'
import {
  ENTRYPOINT_ADDRESS_V06,
  GetUserOperationReceiptReturnType,
  createBundlerClient
} from 'permissionless'
import { http, toHex } from 'viem'
type RequestEventArgs = Omit<SignClientTypes.EventArguments['session_request'], 'verifyContext'>

const getCallsReceipt = async (getCallParams: GetCallsParams) => {
  /**
   * This is hardcode implementation of wallet_getCallsStatus
   * as we are not maintaining the data for calls bundled right now.
   * Getting directly from bundler the receipt on sepolia chain.
   */
  const apiKey = process.env.NEXT_PUBLIC_PIMLICO_KEY
  const bundlerClient = createBundlerClient({
    entryPoint: ENTRYPOINT_ADDRESS_V06,
    transport: http(`https://api.pimlico.io/v1/sepolia/rpc?apikey=${apiKey}`)
  })
  const userOpReceipt = (await bundlerClient.getUserOperationReceipt({
    hash: getCallParams as `0x${string}`
  })) as GetUserOperationReceiptReturnType | null
  const receipt: GetCallsResult = {
    status: userOpReceipt ? 'CONFIRMED' : 'PENDING',
    receipts: userOpReceipt
      ? [
          {
            logs: userOpReceipt.logs.map(log => ({
              data: log.data,
              address: log.address,
              topics: log.topics
            })),
            blockHash: userOpReceipt.receipt.blockHash,
            blockNumber: toHex(userOpReceipt.receipt.blockNumber),
            gasUsed: toHex(userOpReceipt.actualGasUsed),
            transactionHash: userOpReceipt.receipt.transactionHash,
            status: userOpReceipt.success ? '0x1' : '0x0'
          }
        ]
      : undefined
  }
  return receipt
}

export async function approveEIP5792Request(requestEvent: RequestEventArgs) {
  const { params, id } = requestEvent
  const { chainId, request } = params
  SettingsStore.setActiveChainId(chainId)
  switch (request.method) {
    case EIP5792_METHODS.WALLET_GET_CAPABILITIES: {
      const wallet = await getWallet(params)
      if (wallet instanceof EIP155Lib)
        return formatJsonRpcResult<GetCapabilitiesResult>(id, supportedEIP5792CapabilitiesForEOA)

      return formatJsonRpcResult<GetCapabilitiesResult>(id, supportedEIP5792CapabilitiesForSCA)
    }
    case EIP5792_METHODS.WALLET_GET_CALLS_STATUS: {
      try {
        const getCallParams = request.params[0] as GetCallsParams
        const receipt = await getCallsReceipt(getCallParams)
        return formatJsonRpcResult(id, receipt)
      } catch (error: any) {
        console.error(error)
        alert(error.message)
        return formatJsonRpcError(id, error.message)
      }
    }

    case EIP5792_METHODS.WALLET_SHOW_CALLS_STATUS: {
      // TODO: Added support for show calls status
      return formatJsonRpcError(id, 'Not supported.')
    }
    case EIP5792_METHODS.WALLET_SEND_CALLS: {
      try {
        const wallet = await getWallet(params)
        if (wallet instanceof EIP155Lib) {
          return formatJsonRpcError(id, "Wallet currently don't support batch call for EOA")
        }
        const isChainSupported =
          supportedEIP5792CapabilitiesForSCA[toHex(EIP155_CHAINS[chainId as TEIP155Chain].chainId)]
            .atomicBatch?.supported || false
        if (!isChainSupported)
          return formatJsonRpcError(
            id,
            `Wallet currently don't support batch call for chainId ${chainId}`
          )
        // chainId on request Params should be same as request Event
        const sendCallParams: SendCallsParams = request.params[0] as SendCallsParams
        if (chainId.split(':')[1] !== BigInt(sendCallParams.chainId).toString())
          return formatJsonRpcError(id, 'ChainId mismatch')
        const userOpHash = await wallet.sendERC5792Calls(sendCallParams)
        return formatJsonRpcResult(id, userOpHash)
      } catch (error: any) {
        console.error(error)
        alert(error.message)
        return formatJsonRpcError(id, error.message)
      }
    }
    default:
      throw new Error(getSdkError('INVALID_METHOD').message)
  }
}

export function rejectEIP5792Request(request: RequestEventArgs) {
  const { id } = request

  return formatJsonRpcError(id, getSdkError('USER_REJECTED').message)
}
