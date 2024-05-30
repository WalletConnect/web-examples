import {
  Address,
  concat,
  concatHex,
  createClient,
  createPublicClient,
  getTypesForEIP712Domain,
  hashTypedData,
  Hex,
  http,
  HttpTransport,
  keccak256,
  PrivateKeyAccount,
  PublicClient,
  toFunctionSelector,
  Transport,
  TypedDataDefinition,
  validateTypedData,
  zeroAddress
} from 'viem'
import { privateKeyToAccount, signMessage } from 'viem/accounts'
import { EIP155Wallet } from '../EIP155Lib'
import { JsonRpcProvider } from '@ethersproject/providers'
import { KernelValidator, signerToEcdsaValidator } from '@zerodev/ecdsa-validator'
import {
  addressToEmptyAccount,
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
  KernelAccountClient
} from '@zerodev/sdk'
import { sepolia } from 'viem/chains'
import { serializeSessionKeyAccount, signerToSessionKeyValidator } from '@zerodev/session-key'
import { getUpdateConfigCall } from '@zerodev/weighted-ecdsa-validator'
import {
  BundlerActions,
  bundlerActions,
  BundlerClient,
  ENTRYPOINT_ADDRESS_V06,
  ENTRYPOINT_ADDRESS_V07
} from 'permissionless'
import { Chain } from '@/consts/smartAccounts'
import { EntryPoint } from 'permissionless/types/entrypoint'
import {
  PERMISSION_VALIDATOR_ADDRESS,
  SECP256K1_SIGNATURE_VALIDATOR_ADDRESS
} from '@/utils/permissionValidatorUtils/constants'
import { executeAbi } from '@/utils/safe7579AccountUtils/abis/Account'
import { ENTRYPOINT_ADDRESS_V07_TYPE, UserOperation } from 'permissionless/_types/types'
import {
  getPermissionScopeData,
  PermissionContext,
  SingleSignerPermission
} from '@/utils/permissionValidatorUtils'
import { SendCallsParams, SendCallsPaymasterServiceCapabilityParam } from '@/data/EIP5792Data'
import { getSendCallData } from '@/utils/EIP5792WalletUtil'
import { paymasterActionsEip7677 } from 'permissionless/experimental'
import { createPimlicoBundlerClient } from 'permissionless/clients/pimlico'
import { PIMLICO_NETWORK_NAMES, UrlConfig } from '@/utils/SmartAccountUtil'

type SmartAccountLibOptions = {
  privateKey: string
  chain: Chain
  sponsored?: boolean
  entryPointVersion?: number
}

export class KernelSmartAccountLib implements EIP155Wallet {
  public chain: Chain
  public isDeployed: boolean = false
  public address?: `0x${string}`
  public sponsored: boolean = true
  public entryPoint: EntryPoint
  private signer: PrivateKeyAccount
  private client: KernelAccountClient<EntryPoint, Transport, Chain | undefined> | undefined
  private publicClient:
    | (PublicClient &
        BundlerClient<ENTRYPOINT_ADDRESS_V07_TYPE> &
        BundlerActions<ENTRYPOINT_ADDRESS_V07_TYPE>)
    | undefined
  private validator: KernelValidator<EntryPoint> | undefined
  public initialized = false

  #signerPrivateKey: string
  public type: string = 'Kernel'
  pimlicoBundlerUrl: HttpTransport

  public constructor({
    privateKey,
    chain,
    sponsored = false,
    entryPointVersion = 7
  }: SmartAccountLibOptions) {
    this.chain = chain
    this.sponsored = sponsored
    this.#signerPrivateKey = privateKey
    this.signer = privateKeyToAccount(privateKey as Hex)
    this.entryPoint = ENTRYPOINT_ADDRESS_V07
    if (entryPointVersion === 6) {
      this.entryPoint = ENTRYPOINT_ADDRESS_V06
    }
    const apiKey = process.env.NEXT_PUBLIC_PIMLICO_KEY
    const pimlicoBundlerUrl = ({ chain }: UrlConfig) =>
      `https://api.pimlico.io/v1/${PIMLICO_NETWORK_NAMES[chain.name]}/rpc?apikey=${apiKey}`
    this.pimlicoBundlerUrl = http(pimlicoBundlerUrl({ chain: this.chain }))
  }
  async init() {
    const projectId = process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID
    if (!projectId) {
      throw new Error('ZeroDev project id expected')
    }
    const bundlerRpc = http(`https://rpc.zerodev.app/api/v2/bundler/${projectId}`)
    this.publicClient = createPublicClient({
      transport: bundlerRpc // use your RPC provider or bundler
    }).extend(bundlerActions(ENTRYPOINT_ADDRESS_V07))

    this.validator = await signerToEcdsaValidator(this.publicClient, {
      signer: this.signer,
      entryPoint: this.entryPoint
    })

    const account = await createKernelAccount(this.publicClient, {
      plugins: {
        sudo: this.validator
      },
      entryPoint: this.entryPoint
    })
    const client = createKernelAccountClient({
      account,
      chain: sepolia,
      entryPoint: this.entryPoint,
      bundlerTransport: bundlerRpc,
      middleware: {
        sponsorUserOperation: async ({ userOperation }) => {
          const zerodevPaymaster = createZeroDevPaymasterClient({
            chain: sepolia,
            entryPoint: this.entryPoint,
            // Get this RPC from ZeroDev dashboard
            transport: http(`https://rpc.zerodev.app/api/v2/paymaster/${projectId}`)
          })
          return zerodevPaymaster.sponsorUserOperation({
            userOperation,
            entryPoint: this.entryPoint
          })
        }
      }
    }).extend(bundlerActions(ENTRYPOINT_ADDRESS_V07))
    this.client = client
    console.log('Smart account initialized', {
      address: account.address,
      //@ts-ignore
      chain: client.chain.name,
      type: this.type
    })
    this.initialized = true
  }

  getMnemonic(): string {
    throw new Error('Method not implemented.')
  }
  getPrivateKey(): string {
    return this.#signerPrivateKey
  }
  getAddress(): string {
    if (!this.client) {
      throw new Error('Client not initialized')
    }
    return this.client.account?.address || ''
  }
  async signMessage(message: string): Promise<string> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }
    const signature = await this.client.account?.signMessage({ message })
    return signature || ''
  }
  async _signTypedData(
    domain: any,
    types: any,
    data: any,
    _primaryType?: string | undefined
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }
    console.log('Signing typed data with Kernel Smart Account')
    const primaryType = _primaryType || ''
    const signature = await this.client.account?.signTypedData({
      domain,
      types,
      primaryType,
      message: data
    })
    return signature || ''
  }
  connect(provider: JsonRpcProvider): any {
    if (!this.client) {
      throw new Error('Client not initialized')
    }
    return this
  }
  async signTransaction(transaction: any): Promise<string> {
    if (!this.client || !this.client.account) {
      throw new Error('Client not initialized')
    }
    const signature = await this.client.account.signTransaction(transaction)
    return signature || ''
  }
  async sendTransaction({ to, value, data }: { to: Address; value: bigint; data: Hex }) {
    console.log('Sending transaction from smart account', { to, value, data })
    if (!this.client || !this.client.account) {
      throw new Error('Client not initialized')
    }

    const txResult = await this.client.sendTransaction({
      to,
      value,
      data,
      account: this.client.account,
      chain: this.chain
    })
    console.log('Transaction completed', { txResult })

    return txResult
  }
  async sendBatchTransaction(
    args: {
      to: Address
      value: bigint
      data: Hex
    }[]
  ) {
    console.log('Sending transaction from smart account', { type: this.type, args })
    if (!this.client || !this.client.account) {
      throw new Error('Client not initialized')
    }
    const userOp = await this.client.prepareUserOperationRequest({
      userOperation: {
        callData: await this.client.account.encodeCallData(args)
      },
      account: this.client.account
    })

    const newSignature = await this.client.account.signUserOperation(userOp)
    console.log('Signatures', { old: userOp.signature, new: newSignature })

    userOp.signature = newSignature

    const userOpHash = await this.client.sendUserOperation({
      userOperation: userOp,
      account: this.client.account
    })
    return userOpHash
  }

  async issueSessionKey(address: `0x${string}`, permissions: string): Promise<string> {
    if (!this.publicClient) {
      throw new Error('Client not initialized')
    }
    if (!address) {
      throw new Error('Target address is required')
    }
    const parsedPermissions = JSON.parse(permissions)
    const sessionKeyAddress = address
    console.log('Issuing new session key', { sessionKeyAddress })
    const emptySessionKeySigner = addressToEmptyAccount(sessionKeyAddress)

    const sessionKeyValidator = await signerToSessionKeyValidator(this.publicClient, {
      signer: emptySessionKeySigner,
      validatorData: {
        permissions: parsedPermissions
      },
      entryPoint: this.entryPoint
    })
    const sessionKeyAccount = await createKernelAccount(this.publicClient, {
      plugins: {
        sudo: this.validator,
        regular: sessionKeyValidator
      },
      entryPoint: this.entryPoint
    })
    console.log('Session key account initialized', { address: sessionKeyAccount.address })
    const serializedSessionKey = await serializeSessionKeyAccount(sessionKeyAccount)
    return serializedSessionKey
  }

  async updateCoSigners(signers: `0x${string}`[]) {
    if (!this.client || !this.publicClient || !this.client.account) {
      throw new Error('Client not initialized')
    }
    const currentAddress = this.signer.address

    if (signers.length === 0 || signers.length > 2) {
      throw new Error('Invalid signer setup')
    }
    const coSigners = signers.map(address => {
      return {
        address,
        weight: 100 / signers.length
      }
    })
    const newSigners = [{ address: currentAddress, weight: 100 }, ...coSigners]
    console.log('Updating account Co-Signers', { newSigners })

    const updateCall = getUpdateConfigCall(this.entryPoint, {
      threshold: 100,
      signers: newSigners
    })

    await this.sendTransaction(updateCall)
  }

  async getCurrentNonce() {
    if (!this.client || !this.client.account) {
      throw new Error('Client not initialized')
    }
    const currentNonce = await this.publicClient!.readContract({
      address: this.client.account.address,
      abi: [
        {
          type: 'function',
          name: 'currentNonce',
          inputs: [],
          outputs: [{ name: '', type: 'uint32', internalType: 'uint32' }],
          stateMutability: 'view'
        }
      ],
      functionName: 'currentNonce',
      args: []
    })
    console.log(`currentNonce : ${currentNonce}`)
    return currentNonce
  }

  async issuePermissionContext(
    targetAddress: Address,
    approvedPermissions: any
  ): Promise<PermissionContext> {
    if (!this.client || !this.client.account) {
      throw new Error('Client not initialized')
    }
    // this permission have dummy policy set to zeroAddress for now,
    // bc current version of PermissionValidator_v1 module don't consider checking policy
    const permissions: SingleSignerPermission[] = [
      {
        validUntil: 0,
        validAfter: 0,
        signatureValidationAlgorithm: SECP256K1_SIGNATURE_VALIDATOR_ADDRESS,
        signer: targetAddress,
        policy: zeroAddress,
        policyData: '0x'
      }
    ]

    const permittedScopeData = getPermissionScopeData(permissions, this.chain)
    // the smart account sign over the permittedScope and targetAddress
    const permittedScopeSignature: Hex = await signMessage({
      privateKey: this.getPrivateKey() as `0x${string}`,
      message: { raw: concatHex([keccak256(permittedScopeData), targetAddress]) }
    })

    const nonce = await this.getCurrentNonce()
    const validatorAddress = PERMISSION_VALIDATOR_ADDRESS
    const validatorInitData = '0x'
    const hookAddress = zeroAddress
    const hookData = '0x'
    const selectorData = toFunctionSelector(executeAbi[0])

    const validatorPluginEnableTypeData = {
      domain: {
        name: 'Kernel',
        version: '0.3.0-beta',
        chainId: this.chain.id,
        verifyingContract: this.client.account.address
      },
      types: {
        Enable: [
          { name: 'validationId', type: 'bytes21' },
          { name: 'nonce', type: 'uint32' },
          { name: 'hook', type: 'address' },
          { name: 'validatorData', type: 'bytes' },
          { name: 'hookData', type: 'bytes' },
          { name: 'selectorData', type: 'bytes' }
        ]
      },
      message: {
        validationId: concat([
          '0x01', // indicate secondary type
          validatorAddress
        ]),
        nonce: nonce,
        hook: hookAddress,
        validatorData: validatorInitData as `0x${string}`,
        hookData: hookData as `0x${string}`,
        selectorData: selectorData
      },
      primaryType: 'Enable' as 'Enable'
    }

    const types = {
      EIP712Domain: getTypesForEIP712Domain({
        domain: validatorPluginEnableTypeData.domain
      }),
      ...validatorPluginEnableTypeData.types
    }

    // Need to do a runtime validation check on addresses, byte ranges, integer ranges, etc
    // as we can't statically check this with TypeScript.
    validateTypedData({
      domain: validatorPluginEnableTypeData.domain,
      message: validatorPluginEnableTypeData.message,
      primaryType: validatorPluginEnableTypeData.primaryType,
      types: types
    } as TypedDataDefinition)

    const typedHash = hashTypedData(validatorPluginEnableTypeData)

    let enableSig = await this.validator!.signMessage({
      message: { raw: typedHash }
    })

    return {
      accountType: 'KernelV3',
      accountAddress: this.client.account.address,
      permissionValidatorAddress: validatorAddress,
      permissions: permissions,
      permittedScopeData: permittedScopeData,
      permittedScopeSignature: permittedScopeSignature,
      enableSig: enableSig
    }
  }

  async sendERC5792Calls(sendCallsParam: SendCallsParams) {
    if (!this.client || !this.client.account) {
      throw new Error('Client not initialized')
    }
    const pimlicoBundlerClient = createPimlicoBundlerClient({
      entryPoint: this.entryPoint,
      transport: this.pimlicoBundlerUrl
    })
    const gasPrice = (await pimlicoBundlerClient.getUserOperationGasPrice()).fast
    const calls = getSendCallData(sendCallsParam)
    const capabilities = sendCallsParam.capabilities
    if (capabilities && capabilities['paymasterService']) {
      console.log('executing sendCalls with paymasterService')
      const paymasterService = capabilities[
        'paymasterService'
      ] as SendCallsPaymasterServiceCapabilityParam

      const paymasterUrl = paymasterService.url

      const userOpPreStubData: Omit<
        UserOperation<'v0.7'>,
        'signature' | 'paymaster' | 'paymasterData'
      > = {
        sender: this.client.account.address,
        nonce: await this.client.account.getNonce(),
        factory: await this.client.account.getFactory(),
        factoryData: await this.client.account.getFactoryData(),
        callData: await this.client.account.encodeCallData(calls),
        callGasLimit: 0n,
        verificationGasLimit: 0n,
        preVerificationGas: 0n,
        maxFeePerGas: gasPrice.maxFeePerGas,
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
        // paymaster: '0x',
        paymasterVerificationGasLimit: 0n,
        paymasterPostOpGasLimit: 0n
        // paymasterData: '0x',
        // signature: '0x'
      }

      const paymasterClient = createClient({
        chain: this.chain,
        transport: http(paymasterUrl)
      }).extend(paymasterActionsEip7677(ENTRYPOINT_ADDRESS_V07))

      const paymasterStubData = await paymasterClient.getPaymasterStubData({
        userOperation: userOpPreStubData,
        chain: this.chain,
        context: paymasterService.context
      })
      console.log({ paymasterStubData })
      const userOpWithStubData: UserOperation<'v0.7'> = {
        ...userOpPreStubData,
        ...paymasterStubData,
        signature: '0x'
      }

      const dummySignature = await this.client.account.getDummySignature(userOpWithStubData)
      userOpWithStubData.signature = dummySignature

      const gasEstimation = await pimlicoBundlerClient.estimateUserOperationGas({
        userOperation: userOpWithStubData
      })
      console.log({ gasEstimation })
      const userOpWithGasEstimates: UserOperation<'v0.7'> = {
        ...userOpWithStubData,
        ...gasEstimation
      }

      const paymasterData = await paymasterClient.getPaymasterData({
        userOperation: {
          ...userOpWithGasEstimates,
          paymasterPostOpGasLimit: gasEstimation.paymasterPostOpGasLimit || 0n,
          paymasterVerificationGasLimit: gasEstimation.paymasterVerificationGasLimit || 0n
        },
        chain: this.chain,
        context: paymasterService.context
      })
      console.log({ paymasterData })
      const userOpWithPaymasterData: UserOperation<'v0.7'> = {
        ...userOpWithGasEstimates,
        ...paymasterData
      }

      const userOp = userOpWithPaymasterData

      const newSignature = await this.client.account.signUserOperation(userOp)
      console.log('Signatures', { old: userOp.signature, new: newSignature })

      userOp.signature = newSignature

      const userOpHash = await pimlicoBundlerClient.sendUserOperation({
        userOperation: userOp
      })
      console.log({ userOpHash })
      return userOpHash
    }
    console.log('executing sendCalls')
    return this.sendBatchTransaction(calls)
  }
}
