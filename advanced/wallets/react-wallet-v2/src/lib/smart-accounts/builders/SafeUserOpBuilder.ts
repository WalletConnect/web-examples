import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import {
  FillUserOpParams,
  FillUserOpResponse,
  SendUserOpWithSigantureParams,
  SendUserOpWithSigantureResponse,
  UserOpBuilder
} from './UserOpBuilder'
import { Address, createPublicClient, http } from 'viem'
import { signerToSafeSmartAccount } from 'permissionless/accounts'
import {
  createSmartAccountClient,
  ENTRYPOINT_ADDRESS_V07,
  getUserOperationHash
} from 'permissionless'
import {
  createPimlicoBundlerClient,
  createPimlicoPaymasterClient
} from 'permissionless/clients/pimlico'
import { bundlerUrl, paymasterUrl, publicClientUrl } from '@/utils/SmartAccountUtil'

import { getChainById } from '@/utils/ChainUtil'


export class SafeUserOpBuilder implements UserOpBuilder {
  protected ERC_7579_LAUNCHPAD_ADDRESS: Address = '0xEBe001b3D534B9B6E2500FB78E67a1A137f561CE'
  protected SAFE_4337_MODULE_ADDRESS: Address = '0x3Fdb5BC686e861480ef99A6E3FaAe03c0b9F32e2'
  async fillUserOp(params: FillUserOpParams): Promise<FillUserOpResponse> {
    const privateKey = generatePrivateKey()
    const signer = privateKeyToAccount(privateKey)
    const chain = getChainById(params.chainId)

    const publicClient = createPublicClient({
      transport: http(publicClientUrl({ chain }))
    })

    const paymasterClient = createPimlicoPaymasterClient({
      transport: http(paymasterUrl({ chain }), {
        timeout: 30000
      }),
      entryPoint: ENTRYPOINT_ADDRESS_V07
    })

    const bundlerTransport = http(bundlerUrl({ chain }), {
      timeout: 30000
    })
    const pimlicoBundlerClient = createPimlicoBundlerClient({
      transport: bundlerTransport,
      entryPoint: ENTRYPOINT_ADDRESS_V07
    })

    const safeAccount = await signerToSafeSmartAccount(publicClient, {
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      signer: signer,
      safeVersion: '1.4.1',
      address: params.account,
      safe4337ModuleAddress: this.SAFE_4337_MODULE_ADDRESS,
      //@ts-ignore
      erc7579LaunchpadAddress: this.ERC_7579_LAUNCHPAD_ADDRESS,
    })

    const smartAccountClient = createSmartAccountClient({
      account: safeAccount,
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      chain,
      bundlerTransport,
      middleware: {
        sponsorUserOperation: paymasterClient.sponsorUserOperation, // optional
        gasPrice: async () => (await pimlicoBundlerClient.getUserOperationGasPrice()).fast // if using pimlico bundler
      }
    })
    const account = smartAccountClient.account

    const userOp = await smartAccountClient.prepareUserOperationRequest({
      userOperation: {
        callData: await account.encodeCallData(params.calls)
      },
      account: account
    })
    const hash = getUserOperationHash({
      userOperation: userOp,
      chainId: chain.id,
      entryPoint: ENTRYPOINT_ADDRESS_V07
    })
    return {
      userOp,
      hash
    }
  }
  sendUserOpWithSignature(
    params: SendUserOpWithSigantureParams
  ): Promise<SendUserOpWithSigantureResponse> {
    throw new Error('Method not implemented.')
  }
}
