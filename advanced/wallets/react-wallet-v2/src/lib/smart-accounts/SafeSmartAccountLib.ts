import {
  ENTRYPOINT_ADDRESS_V07,
  SmartAccountClientConfig,
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
  WalletGrantPermissionsParameters,
  WalletGrantPermissionsReturnType,
  concatHex,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  keccak256,
  parseAbiParameters,
  parseSignature,
  zeroAddress
} from 'viem'
import { publicKeyToAddress, signMessage } from 'viem/accounts'
import {
  PERMISSION_VALIDATOR_ADDRESS,
  PERMISSION_VALIDATOR_V2_ADDRESS,
  SECP256K1_SIGNATURE_VALIDATOR_ADDRESS,
  SIMPLE_GAS_POLICY_ADDRESS,
  TIME_FRAME_POLICY_ADDRESS,
  USAGE_LIMIT_POLICY_ADDRESS
} from '@/utils/permissionValidatorUtils/constants'
import { SingleSignerPermission, getPermissionScopeData } from '@/utils/permissionValidatorUtils'
import { setupSafeAbi } from '@/utils/safe7579AccountUtils/abis/Launchpad'
import { Execution } from '@/utils/safe7579AccountUtils/userop'
import { isModuleInstalledAbi } from '@/utils/safe7579AccountUtils/abis/Account'
import { ethers } from 'ethers'
import {
  MOCK_VALIDATOR_V2_ADDRESS,
  SAFE7579_USER_OPERATION_BUILDER_ADDRESS,
  SAFE7579_USER_OPERATION_BUILDER_V2_ADDRESS
} from '@/utils/safe7579AccountUtils/constants'
import { KeySigner } from 'viem/_types/experimental/erc7715/types/signer'
import { decodeDIDToSecp256k1PublicKey } from '@/utils/HelperUtil'
import { installERC7579Module } from '@/utils/ERC7579AccountUtils'

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
    const setUpSafeUserOpHash = await this.setupSafe7579({ to, value, data })
    if (setUpSafeUserOpHash) {
      const txReceipt = await this.bundlerClient.waitForUserOperationReceipt({
        hash: setUpSafeUserOpHash,
        timeout: 120000
      })
      return txReceipt.receipt.transactionHash
    }

    //This is executed only if safe is already setup and deployed
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
    const setUpSafeUserOpHash = await this.setupSafe7579(calls)
    if (setUpSafeUserOpHash) return setUpSafeUserOpHash

    //this execution starts only if safe is already setup and deployed
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

  async grantPermissions(
    grantPermissionsRequestParams: WalletGrantPermissionsParameters
  ): Promise<WalletGrantPermissionsReturnType> {
    if (!this.client?.account) {
      throw new Error('Client not initialized')
    }

    const signer = grantPermissionsRequestParams.signer
    // check if signer type is  AccountSigner then it will have data.id
    if (signer && !(signer.type === 'key')) {
      throw Error('Currently only supporting KeySigner Type for permissions')
    }
    const typedSigner = signer as KeySigner
    const id = typedSigner.data.id
    const publicKey = decodeDIDToSecp256k1PublicKey(id)
    const targetAddress = publicKeyToAddress(publicKey as `0x${string}`)
    console.log({ targetAddress })

    // setUpSafe account
    const setUpSafeUserOpHash = await this.setupSafe7579({
      data: '0x',
      to: zeroAddress,
      value: BigInt(0)
    })
    if (setUpSafeUserOpHash) {
      const txReceipt = await this.bundlerClient.waitForUserOperationReceipt({
        hash: setUpSafeUserOpHash,
        timeout: 120000
      })
      console.log({ txReceipt })
    }
    // check permissionvalidator_v2 module is installed or not
    const isInstalled = await this.isPermissionValidatorModuleInstalled(
      PERMISSION_VALIDATOR_V2_ADDRESS
    )
    console.log({ isInstalled })
    if (!isInstalled) {
      console.log(`Installing PemissionValidator_v2`)
      const installInitData = this.getPermissionValidatorV2InstallInitData(
        this.client.account.address,
        targetAddress
      )
      const data = encodeAbiParameters(parseAbiParameters(['uint256[], bytes[], bytes']), [
        [BigInt(1), BigInt(2)],
        ['0x', '0x'],
        installInitData
      ])
      console.log({ data })
      const installTxReceipt = await installERC7579Module({
        accountAddress: this.client.account.address,
        chainId: this.client.chain?.id.toString()!,
        module: {
          module: PERMISSION_VALIDATOR_V2_ADDRESS,
          type: 'validator',
          data: data
        }
      })
      console.log({ installTxReceipt })
    }
    console.log(`granting permissions...`)
    const { permissionsContext } = await this.getAllowedPermissionsAndData_V2(targetAddress)

    return {
      permissionsContext: permissionsContext,
      grantedPermissions: grantPermissionsRequestParams.permissions,
      expiry: grantPermissionsRequestParams.expiry,
      signerData: {
        userOpBuilder: SAFE7579_USER_OPERATION_BUILDER_V2_ADDRESS,
        submitToAddress: this.client.account.address
      }
    } as WalletGrantPermissionsReturnType
  }

  private async setupSafe7579(calls: Execution | Execution[]) {
    if (!this.client?.account) {
      throw new Error('Client not initialized')
    }
    const accountDeployed = await isSmartAccountDeployed(
      this.publicClient,
      this.client.account.address
    )
    if (!accountDeployed) {
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
      console.log('SetUp Safe completed.')
      return setUpAndExecuteUserOpHash
    }
  }

  private async isPermissionValidatorModuleInstalled(moduleAddress: Address) {
    if (!this.client?.account) {
      throw new Error('Client not initialized')
    }
    return await this.publicClient.readContract({
      address: this.client.account.address,
      abi: isModuleInstalledAbi,
      functionName: 'isModuleInstalled',
      args: [
        BigInt(1), // ModuleType
        moduleAddress, // Module Address
        '0x' // Additional Context
      ],
      factory: undefined,
      factoryData: undefined
    })
  }

  private getPermissionValidatorV2InstallInitData(accountAddress: Address, signer: Address) {
    const sessionSigner1 = signer
    const wcSignerValidator = '0xC65Ae0bBD34075A4341AE8314BA67046ab44B326'
    const account = accountAddress
    const currentTime = BigInt(Date.now())

    //example signerId
    const signerId = keccak256(
      encodePacked(
        ['string', 'address', 'address', 'uint256'],
        ['Signer Id for ', account, wcSignerValidator, currentTime]
      )
    )
    //4byte - permissionDescriptor
    const setupSignerMode = 1 << 24 // setup signer mode = true
    const numberOfUserOpPolicies = 0 << 16 // number of userOp policies
    const numberOfActionPolicies = 0 << 8 // number of action policies
    const numberOf1271Policies = 0 // number of 1271 policies

    // Combine the values using bitwise OR
    const permissionDataStructureDescriptor =
      setupSignerMode | numberOfUserOpPolicies | numberOfActionPolicies | numberOf1271Policies

    // Convert the result to a 4-byte hexadecimal string
    const permissionDataStructureDescriptorHex = `0x${permissionDataStructureDescriptor
      .toString(16)
      .padStart(8, '0')}` as `0x${string}`
    console.log({ permissionDataStructureDescriptorHex })
    let permissionDataWithMode = encodePacked(
      ['bytes1', 'bytes32', 'bytes4', 'address', 'uint32', 'bytes'],
      [
        '0x01',
        signerId,
        permissionDataStructureDescriptorHex,
        wcSignerValidator,
        20,
        sessionSigner1
      ]
    )

    // // userOp policies
    // permissionDataWithMode = encodePacked(
    //   ['bytes','address','uint32','uint256','address','uint32','uint256'],
    //   [
    //     permissionDataWithMode,
    //     USAGE_LIMIT_POLICY_ADDRESS, // usageLimitPolicy address
    //     32, // usageLimitPolicy config data length
    //     BigInt(10), // limit
    //     SIMPLE_GAS_POLICY_ADDRESS, // simpleGasPolicy address
    //     32, // simpleGasPolicy config data length
    //     BigInt(2 ** (256 - 1)) // limit
    //   ]
    // );

    // const actionId = keccak256(encodePacked(['string'],['randomActionId'])); //action Id

    // // action policies
    // permissionDataWithMode = encodePacked(
    //   ['bytes','bytes32','address','uint32','uint256','address','uint32','uint256'],
    //   [
    //     permissionDataWithMode,
    //     actionId,
    //     USAGE_LIMIT_POLICY_ADDRESS,
    //     32, // usageLimitPolicy config data length
    //     BigInt(5), // limit
    //     TIME_FRAME_POLICY_ADDRESS,
    //     32, // timeFramePolicy config data length
    //     BigInt(((Date.now() + 1000) << 128) + (Date.now()))
    //   ]
    // )
    //   // 1271 policies
    // permissionDataWithMode = encodePacked(
    //   ['bytes','address','uint32','uint256'],
    //   [
    //     permissionDataWithMode,
    //     TIME_FRAME_POLICY_ADDRESS,
    //     32, // timeFramePolicy config data length
    //     BigInt(((Date.now() + 11_111) << 128) + (Date.now() + 500))
    //   ]
    // );
    return permissionDataWithMode
  }

  private async getAllowedPermissionsAndData_V2(signer: Address) {
    const sessionSigner1 = signer
    const wcSignerValidator = '0xC65Ae0bBD34075A4341AE8314BA67046ab44B326'
    const account = this.client?.account?.address as Address
    const currentTime = BigInt(Date.now())

    //example signerId
    const signerId = keccak256(
      encodePacked(
        ['string', 'address', 'address', 'uint256'],
        ['Signer Id for ', account, wcSignerValidator, currentTime]
      )
    )
    //4byte - permissionDescriptor
    const setupSignerMode = 1 << 24 // setup signer mode = true
    const numberOfUserOpPolicies = 0 << 16 // number of userOp policies
    const numberOfActionPolicies = 0 << 8 // number of action policies
    const numberOf1271Policies = 0 // number of 1271 policies

    // Combine the values using bitwise OR
    const permissionDataStructureDescriptor =
      setupSignerMode | numberOfUserOpPolicies | numberOfActionPolicies | numberOf1271Policies

    // Convert the result to a 4-byte hexadecimal string
    const permissionDataStructureDescriptorHex = `0x${permissionDataStructureDescriptor
      .toString(16)
      .padStart(8, '0')}` as `0x${string}`

    let permissionData = encodePacked(
      ['bytes32', 'bytes4', 'address', 'uint32', 'bytes'],
      [signerId, permissionDataStructureDescriptorHex, wcSignerValidator, 20, sessionSigner1]
    )

    const permissionDigest = keccak256(permissionData)

    const permissionEnableData = encodePacked(
      ['uint64', 'bytes32'],
      [
        BigInt(this.chain.id), //sepolia chaid
        permissionDigest
      ]
    )

    let permissionEnableDataSignature: Hex = await signMessage({
      privateKey: this.getPrivateKey() as `0x${string}`,
      message: { raw: concatHex([keccak256(permissionEnableData)]) }
    })
    const { r, s, v } = parseSignature(permissionEnableDataSignature)
    // Check if v is undefined
    if (v === undefined) {
      // Option 1: Use only r and s
      permissionEnableDataSignature = encodePacked(['bytes32', 'bytes32'], [r, s])
    } else {
      // Option 2: Use r, s, and v
      permissionEnableDataSignature = encodePacked(['bytes32', 'bytes32', 'uint256'], [r, s, v])
    }

    permissionEnableDataSignature = encodePacked(
      ['address', 'bytes'],
      [MOCK_VALIDATOR_V2_ADDRESS, permissionEnableDataSignature]
    )
    // Set the signature
    const permissionsContext = encodePacked(
      ['address', 'bytes1', 'bytes'],
      [
        PERMISSION_VALIDATOR_V2_ADDRESS,
        '0x01', //Enable mode
        encodeAbiParameters(parseAbiParameters('uint8, bytes, bytes, bytes'), [
          1, // index of permission in sessionEnableData
          permissionEnableData,
          permissionEnableDataSignature,
          permissionData
        ])
      ]
    )

    return {
      permissionsContext,
      permissionData
    }
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

  async manageModule(calls: Execution[]) {
    console.log({ calls })
    const userOpHash = await this.sendBatchTransaction(calls)
    return await this.bundlerClient.waitForUserOperationReceipt({
      hash: userOpHash,
      timeout: 120000
    })
  }
}
