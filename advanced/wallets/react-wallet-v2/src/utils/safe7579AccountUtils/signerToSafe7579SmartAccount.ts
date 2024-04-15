import type {  TypedData } from "viem"
import Launchpad from "./abis/Launchpad.json";
import AccountFactory from "./abis/AccountFactory.json";
import AccountInterface from "./abis/Account.json";
import {
    type Address,
    type Chain,
    type Client,
    type Hex,
    type LocalAccount,
    type Transport,
    type TypedDataDefinition,
    concatHex,
    encodeAbiParameters,
    encodeFunctionData,
    encodePacked,
    pad,
    zeroAddress,
    keccak256,
    stringToBytes,
    publicActions
} from "viem"
import { getChainId, signMessage, signTypedData } from "viem/actions"
import { ENTRYPOINT_ADDRESS_V07_TYPE, EntryPoint } from "permissionless/types/entrypoint"
import { SignTransactionNotSupportedBySmartAccount, SmartAccount, SmartAccountSigner, toSmartAccount } from "permissionless/accounts"
import { getAccountNonce, getUserOperationHash, isSmartAccountDeployed } from "permissionless"
import { Prettify, } from "viem/chains"
import { LAUNCHPAD_ADDRESS, SAFE_7579_ADDRESS, SAFE_ACCOUNT_FACTORY_ADDRESS, SAFE_SINGLETON_ADDRESS, VALIDATOR_ADDRESS } from "./constants"
import { CALL_TYPE, encodeUserOpCallData } from "./userop"

export type Safe7579SmartAccount<
    entryPoint extends ENTRYPOINT_ADDRESS_V07_TYPE,
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined
> = SmartAccount<entryPoint, "safe7579SmartAccount", transport, chain>
type  TTypedData = TypedData | Record<string, unknown>
type TPrimaryType =
    | keyof TTypedData
    | "EIP712Domain" | keyof TTypedData
/**
 * The account creation ABI for Safe7579 Smart Account
 */

const createAccountAbi = [
    {
        inputs: [
            {
                internalType: "address",
                name: "validationModule",
                type: "address"
            },
            {
                internalType: "bytes",
                name: "moduleInstallData",
                type: "bytes"
            },
            {
                internalType: "uint256",
                name: "index",
                type: "uint256"
            }
        ],
        name: "createAccount",
        outputs: [
            {
                internalType: "address payable",
                name: "",
                type: "address"
            }
        ],
        stateMutability: "payable",
        type: "function"
    }
] as const

type InitialModule = {
  module: Address;
  initData: Hex;
};

function getInitialValidators(initialValidatorModuleAddress:Address[]): InitialModule[] {
  const initialValidators: InitialModule[] = initialValidatorModuleAddress.map(validatorModuleAddress => {
    return {
      module: validatorModuleAddress,
      initData: "0x",
    } 
  })
  return initialValidators;
}
const initDataAbi = [
  {
    components: [
      {
        name: "singleton",
        type: "address",
      },
      {
        name: "owners",
        type: "address[]",
      },
      {
        name: "threshold",
        type: "uint256",
      },
      {
        name: "setupTo",
        type: "address",
      },
      {
        name: "setupData",
        type: "bytes",
      },
      {
        name: "safe7579",
        type: "address",
      },
      {
        components: [
          {
            name: "module",
            type: "address",
          },
          {
            name: "initData",
            type: "bytes",
          },
        ],
        name: "validators",
        type: "tuple[]",
      },
      {
        name: "callData",
        type: "bytes",
      },
    ],
    name: "InitData",
    type: "tuple",
  },
];
const getInitData= (owner:Address,initialValidators:InitialModule[]) => {
  return {
    singleton: SAFE_SINGLETON_ADDRESS,
    owners: [owner],
    threshold: BigInt(1),
    setupTo: LAUNCHPAD_ADDRESS,
    setupData: encodeFunctionData({
      abi: Launchpad.abi,
      functionName: "initSafe7579",
      args: [
        SAFE_7579_ADDRESS,
        [],
        [],
        [],
        {
          module: zeroAddress,
          initData: "0x",
        },
        [],
        0,
      ],
    }),
    safe7579: SAFE_7579_ADDRESS,
    validators: initialValidators,
    callData: encodeUserOpCallData({
      actions: [
        {
          target: zeroAddress as Address,
          value: "0",
          callData: "0x" as Hex,
        },
      ],
    }),
  };
}
/**
 * Get the account initialization code for Safe7579 smart account default authorization module
 * @param owner
 * @param index
 * @param initialValidatorAddress
 */
const getAccountInitCode = async ({
    owner,
    index,
    initialValidatorAddress
}: {
    owner: Address
    index: bigint
    initialValidatorAddress: Address
}): Promise<Hex> => {
    if (!owner) throw new Error("Owner account not found")
    const initialValidators = getInitialValidators([initialValidatorAddress]);
    const initData = getInitData(owner,initialValidators)
    const initHash = keccak256(encodeAbiParameters(initDataAbi, [initData]));
    const factoryInitializer = encodeFunctionData({
      abi: Launchpad.abi,
      functionName: "preValidationSetup",
      args: [initHash, zeroAddress, ""],
    });

    const salt = keccak256(stringToBytes(index.toString()));
   
    const initCode =  encodeFunctionData({
          abi: AccountFactory.abi,
          functionName: "createProxyWithNonce",
          args: [LAUNCHPAD_ADDRESS, factoryInitializer, salt],
        });
    return initCode
}

const getAccountAddress = async <
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>({
    client,
    factoryAddress,
    initialValidatorAddress,
    entryPoint: entryPointAddress,
    owner,
    index = 0n
}: {
    client: Client<TTransport, TChain>
    factoryAddress: Address
    initialValidatorAddress: Address
    owner: Address
    entryPoint: entryPoint
    index?: bigint
}): Promise<Address> => {
  const salt = keccak256(stringToBytes(index.toString()));
  const initialValidators = getInitialValidators([initialValidatorAddress]);
  const initData = getInitData(owner,initialValidators)
  const initHash = keccak256(encodeAbiParameters(initDataAbi, [initData]));
  const factoryInitializer = encodeFunctionData({
    abi: Launchpad.abi,
    functionName: "preValidationSetup",
    args: [initHash, zeroAddress, ""],
  });

  const publicClient = client.extend(publicActions)
  
  const safeProxyCreationCode = (await publicClient.readContract({
    address:  factoryAddress, // SAFE_ACCOUNT_FACTORY_ADDRESS,
    abi: AccountFactory.abi,
    functionName: "proxyCreationCode",
    args: [],
  })) as Hex;

  const address = (await publicClient.readContract({
    address: LAUNCHPAD_ADDRESS,
    abi: Launchpad.abi,
    functionName: "predictSafeAddress",
    args: [
      LAUNCHPAD_ADDRESS,
      factoryAddress, // SAFE_ACCOUNT_FACTORY_ADDRESS,
      safeProxyCreationCode,
      salt,
      factoryInitializer,
    ],
  })) as Address;
  // Get the sender address based on the init code
  return address
}

export type SignerToSafe7579SmartAccountParameters<
    entryPoint extends ENTRYPOINT_ADDRESS_V07_TYPE,
    TSource extends string = string,
    TAddress extends Address = Address
> = Prettify<{
    signer: SmartAccountSigner<TSource, TAddress>
    entryPoint: entryPoint
    address?: Address
    index?: bigint
    factoryAddress?: Address
    initialValidatorAddress?: Address
}>

/**
 * Build a Safe7579 modular smart account from a private key, that use the ECDSA signer behind the scene
 * @param client
 * @param privateKey
 * @param entryPoint
 * @param index
 * @param factoryAddress
 * @param accountLogicAddress
 * @param ecdsaValidatorAddress
 */
export async function signerToSafe7579SmartAccount<
    entryPoint extends ENTRYPOINT_ADDRESS_V07_TYPE,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = string,
    TAddress extends Address = Address
>(
    client: Client<TTransport, TChain, undefined>,
    {
        signer,
        address,
        entryPoint: entryPointAddress,
        index = 0n,
        factoryAddress = SAFE_ACCOUNT_FACTORY_ADDRESS,
        initialValidatorAddress = VALIDATOR_ADDRESS
    }: SignerToSafe7579SmartAccountParameters<entryPoint, TSource, TAddress>
): Promise<Safe7579SmartAccount<entryPoint, TTransport, TChain>> {
    // Get the private key related account
    const viemSigner: LocalAccount = {
        ...signer,
        signTransaction: (_, __) => {
            throw new SignTransactionNotSupportedBySmartAccount()
        }
    } as LocalAccount

    // Helper to generate the init code for the smart account
    const generateInitCode = () =>
        getAccountInitCode({
            owner: viemSigner.address,
            index,
            initialValidatorAddress
        })

    // Fetch account address and chain id
    const [accountAddress, chainId] = await Promise.all([
        address ??
            getAccountAddress<entryPoint, TTransport, TChain>({
                client,
                factoryAddress,
                initialValidatorAddress,
                entryPoint: entryPointAddress,
                owner: viemSigner.address,
                index
            }),
        getChainId(client)
    ])

    if (!accountAddress) throw new Error("Account address not found")

    let smartAccountDeployed = await isSmartAccountDeployed(
        client,
        accountAddress
    )

    return toSmartAccount({
    address: accountAddress,
    client: client,
    publicKey: accountAddress,
    entryPoint: entryPointAddress,
    source: "safe7579SmartAccount",

    async signMessage({ message }) {
        let signature: Hex = await signMessage(client, {
            account: viemSigner,
            message
        })
        const potentiallyIncorrectV = parseInt(signature.slice(-2), 16)
        if (![27, 28].includes(potentiallyIncorrectV)) {
            const correctV = potentiallyIncorrectV + 27
            signature = (signature.slice(0, -2) +
                correctV.toString(16)) as Hex
        }
        return encodeAbiParameters(
            [{ type: "bytes" }, { type: "address" }],
            [signature, initialValidatorAddress]
        )
    },

    async signTransaction(_, __) {
        throw new SignTransactionNotSupportedBySmartAccount()
    },
    // @ts-ignore
    async signTypedData<TTypedData,TPrimaryType>(typedData: TypedDataDefinition<TTypedData, TPrimaryType>) {
        let signature: Hex = await signTypedData<
          // @ts-ignore
            TTypedData,
            TPrimaryType,
            TChain,
            undefined
        >(client, {
            account: viemSigner,
            ...typedData
        })
        const potentiallyIncorrectV = parseInt(signature.slice(-2), 16)
        if (![27, 28].includes(potentiallyIncorrectV)) {
            const correctV = potentiallyIncorrectV + 27
            signature = (signature.slice(0, -2) +
                correctV.toString(16)) as Hex
        }
        return encodeAbiParameters(
            [{ type: "bytes" }, { type: "address" }],
            [signature, initialValidatorAddress]
        )
    },

    // Get the nonce of the smart account
    async getNonce() {
      return await getAccountNonce(client, {
        sender: accountAddress,
        entryPoint: entryPointAddress,
        key: BigInt(
          pad(initialValidatorAddress, {
            dir: "right",
            size: 24,
          }) || 0
        ),
      });
    },

    // Sign a user operation
    async signUserOperation(userOperation) {
      
      const hash = getUserOperationHash({
          userOperation: {
              ...userOperation,
              signature: "0x"
          },
          entryPoint: entryPointAddress,
          chainId: chainId
      })
      
      const signature = await signMessage(client, {
          account: viemSigner,
          message: { raw: hash }
      })
      return signature
    },

    async getFactory() {
        if (smartAccountDeployed) return undefined
        smartAccountDeployed = await isSmartAccountDeployed(
            client,
            accountAddress
        )
        if (smartAccountDeployed) return undefined

        return factoryAddress
    },

    async getFactoryData() {
      // if (smartAccountDeployed) return undefined
      smartAccountDeployed = await isSmartAccountDeployed(
          client,
          accountAddress
      )
      if (smartAccountDeployed) return undefined
      return generateInitCode()
    },

    // Encode the init code
    async getInitCode() {
      // if (smartAccountDeployed) return "0x"
      smartAccountDeployed = await isSmartAccountDeployed(
          client,
          accountAddress
      )
      if (smartAccountDeployed) return "0x"

      return concatHex([factoryAddress, await generateInitCode()])
    },

    // Encode the deploy call data
    async encodeDeployCallData(_) {
        throw new Error("Doesn't support account deployment")
    },

    // Encode a call
    async encodeCallData(args) {
      smartAccountDeployed = await isSmartAccountDeployed(
        client,
        accountAddress
      )
      if (!smartAccountDeployed) {
        const initData = getInitData(viemSigner.address,getInitialValidators([initialValidatorAddress]))
        return encodeFunctionData({
          abi: Launchpad.abi,
          functionName: "setupSafe",
          args: [initData],
        })
      }
      
      if (Array.isArray(args)) {
        // Encode a batched call
        const argsArray = args as {
          to: Address
          value: bigint
          data: Hex
        }[]
        console.log("argsArray", argsArray)
        return encodeFunctionData({
          functionName: "execute",
          abi: AccountInterface.abi,
          args: [
            CALL_TYPE.BATCH,
            encodeAbiParameters(
              [
                {
                  components: [
                    {
                      name: "to",
                      type: "address",
                    },
                    {
                      name: "value",
                      type: "uint256",
                    },
                    {
                      name: "data",
                      type: "bytes",
                    },
                  ],
                  name: "Execution",
                  type: "tuple[]",
                },
              ],
              // @ts-ignore
              [argsArray]
            ),
          ],
        });
      }
      const { to, value, data } = args as {
        to: Address
        value: bigint
        data: Hex
      }
      return encodeFunctionData({
        functionName: "execute",
        abi: AccountInterface.abi,
        args: [
          CALL_TYPE.SINGLE,
          encodePacked(
            ["address", "uint256", "bytes"],
            [to, BigInt(Number(value)), data]
          ),
        ],
      });
    },

    // Get simple dummy signature for authorization
    async getDummySignature(_userOperation) {
      return `0xe8b94748580ca0b4993c9a1b86b5be851bfc076ff5ce3a1ff65bf16392acfcb800f9b4f1aef1555c7fce5599fffb17e7c635502154a0333ba21f3ae491839af51c`
    }
  })
}