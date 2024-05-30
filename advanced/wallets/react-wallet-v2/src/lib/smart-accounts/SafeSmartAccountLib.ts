import {
  ENTRYPOINT_ADDRESS_V07,
  SmartAccountClientConfig,
  UserOperation,
  isSmartAccountDeployed
} from 'permissionless'
import { SmartAccountLib } from './SmartAccountLib'
import { SmartAccount } from 'permissionless/accounts'
import { EntryPoint } from 'permissionless/types/entrypoint'
import {
  getSafe7579InitData,
  getSafe7579InitialValidators,
  signerToSafe7579SmartAccount
} from '@/utils/safe7579AccountUtils/signerToSafe7579SmartAccount'
import {
  Address,
  Hex,
  concatHex,
  createClient,
  encodeFunctionData,
  http,
  keccak256,
  zeroAddress
} from 'viem'
import { signMessage } from 'viem/accounts'
import {
  PERMISSION_VALIDATOR_ADDRESS,
  SECP256K1_SIGNATURE_VALIDATOR_ADDRESS
} from '@/utils/permissionValidatorUtils/constants'
import {
  PermissionContext,
  SingleSignerPermission,
  getPermissionScopeData
} from '@/utils/permissionValidatorUtils'
import { setupSafeAbi } from '@/utils/safe7579AccountUtils/abis/Launchpad'
import { Execution } from '@/utils/safe7579AccountUtils/userop'
import { paymasterActionsEip7677 } from 'permissionless/experimental'
import { getSendCallData } from '@/utils/EIP5792WalletUtil'
import { SendCallsParams, SendCallsPaymasterServiceCapabilityParam } from '@/data/EIP5792Data'

export class SafeSmartAccountLib extends SmartAccountLib {
  async getClientConfig(): Promise<SmartAccountClientConfig<EntryPoint>> {
    this.type = 'Safe'
    const safeAccount = await signerToSafe7579SmartAccount(this.publicClient, {
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      signer: this.signer
    })
    return {
      name: 'Safe7579SmartAccount',
      account: safeAccount as SmartAccount<EntryPoint>,
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      chain: this.chain,
      bundlerTransport: this.bundlerUrl,
      middleware: {
        gasPrice: async () => (await this.bundlerClient.getUserOperationGasPrice()).fast, // use pimlico bundler to get gas prices
        sponsorUserOperation: this.sponsored ? this.paymasterClient.sponsorUserOperation : undefined
      }
    }
  }

  async sendTransaction({ to, value, data }: Execution) {
    if (!this.client || !this.client.account) {
      throw new Error('Client not initialized')
    }
    const accountDeployed = await isSmartAccountDeployed(
      this.publicClient,
      this.client.account.address
    )
    if (!accountDeployed) {
      const setUpAndExecuteUserOpHash = await this.setupSafe7579AndExecute({ to, value, data })
      const userOpReceipt = await this.bundlerClient.waitForUserOperationReceipt({
        hash: setUpAndExecuteUserOpHash
      })
      return userOpReceipt.receipt.transactionHash
    }

    const txResult = await this.client.sendTransaction({
      to,
      value,
      data,
      account: this.client.account,
      chain: this.chain
    })

    return txResult
  }

  async sendBatchTransaction(calls: Execution[]) {
    if (!this.client || !this.client.account) {
      throw new Error('Client not initialized')
    }
    const accountDeployed = await isSmartAccountDeployed(
      this.publicClient,
      this.client.account.address
    )
    if (!accountDeployed) {
      return await this.setupSafe7579AndExecute(calls)
    }

    const userOp = await this.client.prepareUserOperationRequest({
      userOperation: {
        callData: await this.client.account.encodeCallData(calls)
      },
      account: this.client.account
    })

    const newSignature = await this.client.account.signUserOperation(userOp)
    userOp.signature = newSignature

    const userOpHash = await this.bundlerClient.sendUserOperation({
      userOperation: userOp
    })
    return userOpHash
  }

  async setupSafe7579AndExecute(calls: Execution | Execution[]) {
    if (!this.client || !this.client.account) {
      throw new Error('Client not initialized')
    }

    const initialValidators = getSafe7579InitialValidators()
    const initData = getSafe7579InitData(this.signer.address, initialValidators, calls)
    const setUpSafe7579Calldata = encodeFunctionData({
      abi: setupSafeAbi,
      functionName: 'setupSafe',
      args: [initData]
    })
    const setUpUserOp = await this.client.prepareUserOperationRequest({
      userOperation: {
        callData: setUpSafe7579Calldata
      },
      account: this.client.account
    })
    const newSignature = await this.client.account.signUserOperation(setUpUserOp)

    setUpUserOp.signature = newSignature

    const setUpAndExecuteUserOpHash = await this.bundlerClient.sendUserOperation({
      userOperation: setUpUserOp
    })

    return setUpAndExecuteUserOpHash
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

    return {
      accountType: 'Safe7579',
      accountAddress: this.client.account.address,
      permissionValidatorAddress: PERMISSION_VALIDATOR_ADDRESS,
      permissions: permissions,
      permittedScopeData: permittedScopeData,
      permittedScopeSignature: permittedScopeSignature
    }
  }

  async sendERC5792Calls(sendCallsParam: SendCallsParams) {
    if (!this.client || !this.client.account) {
      throw new Error('Client not initialized')
    }
    const gasPrice = (await this.bundlerClient.getUserOperationGasPrice()).fast
    const calls = getSendCallData(sendCallsParam)
    const accountDeployed = await isSmartAccountDeployed(
      this.publicClient,
      this.client.account.address
    )
    let callData = await this.client.account.encodeCallData(calls)
    if (!accountDeployed) {
      const initialValidators = getSafe7579InitialValidators()
      const initData = getSafe7579InitData(this.signer.address, initialValidators, calls)
      const setUpSafe7579Calldata = encodeFunctionData({
        abi: setupSafeAbi,
        functionName: 'setupSafe',
        args: [initData]
      })
      callData = setUpSafe7579Calldata
    }

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
        callData: callData,
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

      const gasEstimation = await this.bundlerClient.estimateUserOperationGas({
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

      const userOpHash = await this.bundlerClient.sendUserOperation({
        userOperation: userOp
      })
      console.log({ userOpHash })
      return userOpHash
    }
    console.log('executing sendCalls')
    return this.sendBatchTransaction(calls)
  }
}
