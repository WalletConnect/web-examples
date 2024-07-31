import {
  ENTRYPOINT_ADDRESS_V07,
  SmartAccountClientConfig,
  UserOperation,
  getPackedUserOperation,
  isSmartAccountDeployed
} from 'permissionless'
import { SmartAccountLib } from './SmartAccountLib'
import { SmartAccount, signerToSafeSmartAccount } from 'permissionless/accounts'
import { EntryPoint } from 'permissionless/types/entrypoint'
import {
  Address,
  Hex,
  WalletGrantPermissionsParameters,
  WalletGrantPermissionsReturnType,
  concatHex,
  encodePacked,
  keccak256,
  zeroAddress
} from 'viem'
import { publicKeyToAddress, signMessage } from 'viem/accounts'
import {
  PERMISSION_VALIDATOR_ADDRESS,
  SAFE7579_USER_OPERATION_BUILDER_ADDRESS,
  SECP256K1_SIGNATURE_VALIDATOR_ADDRESS
} from '@/utils/permissionValidatorUtils/constants'
import { SingleSignerPermission, getPermissionScopeData } from '@/utils/permissionValidatorUtils'
import { ethers } from 'ethers'
import { KeySigner } from 'viem/_types/experimental/erc7715/types/signer'
import { bigIntReplacer, decodeDIDToSecp256k1PublicKey } from '@/utils/HelperUtil'
import { isModuleInstalledAbi } from '@/utils/ERC7579AccountUtils'

export class SafeSmartAccountLib extends SmartAccountLib {
  protected ERC_7579_LAUNCHPAD_ADDRESS: Address = '0xEBe001b3D534B9B6E2500FB78E67a1A137f561CE'
  protected SAFE_4337_MODULE_ADDRESS: Address = '0x3Fdb5BC686e861480ef99A6E3FaAe03c0b9F32e2'

  async getClientConfig(): Promise<SmartAccountClientConfig<EntryPoint>> {
    this.type = 'Safe'
    const safeAccount = await signerToSafeSmartAccount(this.publicClient, {
      safeVersion: '1.4.1',
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      safe4337ModuleAddress: this.SAFE_4337_MODULE_ADDRESS,
      //@ts-ignore
      erc7579LaunchpadAddress: this.ERC_7579_LAUNCHPAD_ADDRESS,
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

  async sendTransaction({ to, value, data }: { to: Address; value: bigint | Hex; data: Hex }) {
    if (!this.client?.account) {
      throw new Error('Client not initialized')
    }
    const txResult = await this.client.sendTransaction({
      to,
      value: BigInt(value),
      data,
      account: this.client.account,
      chain: this.chain
    })
    return txResult
  }

  async sendBatchTransaction(calls: { to: Address; value: bigint; data: Hex }[]) {
    if (!this.client?.account) {
      throw new Error('Client not initialized')
    }

    const userOp = (await this.client.prepareUserOperationRequest({
      userOperation: {
        callData: await this.client.account.encodeCallData(calls)
      },
      account: this.client.account
    })) as UserOperation<'v0.7'>

    const newSignature = await this.client.account.signUserOperation(userOp)
    userOp.signature = newSignature

    const userOpHash = await this.bundlerClient.sendUserOperation({
      userOperation: userOp
    })

    return userOpHash
  }

  async grantPermissions(
    grantPermissionsRequestParams: WalletGrantPermissionsParameters
  ): Promise<WalletGrantPermissionsReturnType> {
    if (!this.client?.account) {
      throw new Error('Client not initialized')
    }

    await this.ensureAccountDeployed()
    await this.ensurePermissionValidatorInstalled()

    const targetAddress = this.getTargetAddress(grantPermissionsRequestParams.signer)
    const { permissionsContext } = await this.getAllowedPermissionsAndData(targetAddress)

    console.log('Granting permissions...')

    return {
      permissionsContext,
      grantedPermissions: grantPermissionsRequestParams.permissions,
      expiry: grantPermissionsRequestParams.expiry,
      signerData: {
        userOpBuilder: SAFE7579_USER_OPERATION_BUILDER_ADDRESS,
        submitToAddress: this.client.account.address
      }
    }
  }

  private async ensureAccountDeployed(): Promise<void> {
    if (!this.client?.account) {
      throw new Error('Client not initialized')
    }
    const isAccountDeployed = await isSmartAccountDeployed(
      this.publicClient,
      this.client.account.address
    )
    console.log({ isAccountDeployed })

    if (!isAccountDeployed) {
      await this.deployAccountWithPermissionValidator()
    }
  }

  private async deployAccountWithPermissionValidator(): Promise<void> {
    if (!this.client?.account) {
      throw new Error('Client not initialized')
    }
    const deployAccountUserOpHash = await this.client.installModule({
      account: this.client.account,
      address: PERMISSION_VALIDATOR_ADDRESS,
      context: '0x',
      type: 'validator'
    })
    const deployAccountReceipt = await this.bundlerClient.waitForUserOperationReceipt({
      hash: deployAccountUserOpHash
    })
    console.log({ deployAccountReceipt })
  }

  private async ensurePermissionValidatorInstalled(): Promise<void> {
    const isInstalled = await this.isPermissionValidatorModuleInstalled()
    console.log({ isInstalled })

    if (!isInstalled) {
      await this.installPermissionValidatorModule()
    }
  }

  private async installPermissionValidatorModule(): Promise<void> {
    if (!this.client?.account) {
      throw new Error('Client not initialized')
    }
    const installModuleUserOpHash = await this.client.installModule({
      account: this.client.account,
      address: PERMISSION_VALIDATOR_ADDRESS,
      context: '0x',
      type: 'validator'
    })
    const installModuleReceipt = await this.bundlerClient.waitForUserOperationReceipt({
      hash: installModuleUserOpHash
    })
    console.log({ installModuleReceipt })
  }

  private getTargetAddress(
    signer:
      | {
          type: string
          data?: unknown | undefined
        }
      | undefined
  ): `0x${string}` {
    if (signer?.type !== 'key') {
      throw new Error('Currently only supporting KeySigner Type for permissions')
    }
    const typedSigner = signer as KeySigner
    const publicKey = decodeDIDToSecp256k1PublicKey(typedSigner.data.id)
    return publicKeyToAddress(publicKey as `0x${string}`)
  }

  private async isPermissionValidatorModuleInstalled() {
    if (!this.client?.account) {
      throw new Error('Client not initialized')
    }
    return await this.publicClient.readContract({
      address: this.client.account.address,
      abi: isModuleInstalledAbi,
      functionName: 'isModuleInstalled',
      args: [
        BigInt(1), // ModuleType
        PERMISSION_VALIDATOR_ADDRESS, // Module Address
        '0x' // Additional Context
      ],
      factory: undefined,
      factoryData: undefined
    })
  }

  private async getAllowedPermissionsAndData(signer: Address) {
    // if installed then based on the approvedPermissions build the PermissionsContext value
    // permissionsContext = [PERMISSION_VALIDATOR_ADDRESS][ENCODED_PERMISSION_SCOPE & SIGNATURE_DATA]

    // this permission have dummy policy set to zeroAddress for now,
    // bc current version of PermissionValidator_v1 module don't consider checking policy
    const permissions: SingleSignerPermission[] = [
      {
        validUntil: 0,
        validAfter: 0,
        signatureValidationAlgorithm: SECP256K1_SIGNATURE_VALIDATOR_ADDRESS,
        signer: signer,
        policy: zeroAddress,
        policyData: '0x'
      }
    ]
    console.log(`computing permission scope data...`)
    const permittedScopeData = getPermissionScopeData(permissions, this.chain)
    console.log(`user account signing over computed permission scope data and reguested signer...`)
    // the smart account sign over the permittedScope and targetAddress
    const permittedScopeSignature: Hex = await signMessage({
      privateKey: this.getPrivateKey() as `0x${string}`,
      message: { raw: concatHex([keccak256(permittedScopeData), signer]) }
    })

    const _permissionIndex = BigInt(0)

    const encodedData = ethers.utils.defaultAbiCoder.encode(
      ['uint256', 'tuple(uint48,uint48,address,bytes,address,bytes)', 'bytes', 'bytes'],
      [
        _permissionIndex,
        [
          permissions[0].validAfter,
          permissions[0].validUntil,
          permissions[0].signatureValidationAlgorithm,
          permissions[0].signer,
          permissions[0].policy,
          permissions[0].policyData
        ],
        permittedScopeData,
        permittedScopeSignature
      ]
    ) as `0x${string}`
    console.log(`encoding permissionsContext bytes data...`)
    const permissionsContext = concatHex([
      PERMISSION_VALIDATOR_ADDRESS,
      encodePacked(['uint8', 'bytes'], [1, encodedData])
    ])
    return {
      permissionsContext,
      permittedScopeSignature,
      permittedScopeData,
      permissions
    }
  }

  async manageModule(calls: { to: Address; value: bigint; data: Hex }[]) {
    const userOpHash = await this.sendBatchTransaction(calls)
    return await this.bundlerClient.waitForUserOperationReceipt({
      hash: userOpHash
    })
  }
}
