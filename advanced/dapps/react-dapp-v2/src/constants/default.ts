import { getAppMetadata } from "@walletconnect/utils";

if (!process.env.NEXT_PUBLIC_PROJECT_ID)
  throw new Error("`NEXT_PUBLIC_PROJECT_ID` env variable is missing.");

export const DEFAULT_MAIN_CHAINS = [
  // mainnets
  "eip155:1",
  "eip155:10",
  "eip155:50",
  "eip155:100",
  "eip155:137",
  "eip155:324",
  "eip155:42161",
  "eip155:42220",
  "cosmos:cosmoshub-4",
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  "polkadot:91b171bb158e2d3848fa23a9f1c25182",
  "mvx:1",
  "tron:0x2b6653dc",
  "tezos:mainnet",
  "kadena:mainnet01",
];

export const DEFAULT_TEST_CHAINS = [
  // testnets
  "eip155:5",
  "eip155:51",
  "eip155:11155111",
  "eip155:280",
  "eip155:420",
  "eip155:80001",
  "eip155:421611",
  "eip155:44787",
  "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
  "solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z",
  "polkadot:e143f23803ac50e8f6f8e62695d1ce9e",
  "near:testnet",
  "mvx:D",
  "tron:0xcd8690dc",
  "tezos:testnet",
  "kadena:testnet04",
];

export const DEFAULT_CHAINS = [...DEFAULT_MAIN_CHAINS, ...DEFAULT_TEST_CHAINS];

export const DEFAULT_PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID;
export const DEFAULT_RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL;

export const DEFAULT_LOGGER = "debug";

export const DEFAULT_APP_METADATA = {
  name: "React App",
  description: "React App for WalletConnect",
  url: "https://walletconnect.com/",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
  verifyUrl: "https://verify.walletconnect.com",
};

/**
 * EIP5792
 */
export const DEFAULT_EIP5792_METHODS = {
  WALLET_GET_CAPABILITIES: "wallet_getCapabilities",
  WALLET_SEND_CALLS: "wallet_sendCalls",
  WALLET_GET_CALLS_STATUS: "wallet_getCallsStatus",
} as const;

export type SendCallsParams = {
  version: string;
  chainId: `0x${string}`; // Hex chain id
  from: `0x${string}`;
  calls: {
    to?: `0x${string}` | undefined;
    data?: `0x${string}` | undefined;
    value?: `0x${string}` | undefined; // Hex value
  }[];
  capabilities?: Record<string, any> | undefined;
};

// capability names as string literals
export type CapabilityName = "atomicBatch" | "paymasterService" | "sessionKey";
// Capability type where each key is a capability name and value has `supported` field
export type Capabilities = {
  [K in CapabilityName]: {
    supported: boolean;
  };
};
// GetCapabilitiesResult type using mapped types
export type GetCapabilitiesResult = Record<string, Capabilities>;

export type GetCallsResult = {
  status: "PENDING" | "CONFIRMED";
  receipts?: {
    logs: {
      address: `0x${string}`;
      data: `0x${string}`;
      topics: `0x${string}`[];
    }[];
    status: `0x${string}`; // Hex 1 or 0 for success or failure, respectively
    blockHash: `0x${string}`;
    blockNumber: `0x${string}`;
    gasUsed: `0x${string}`;
    transactionHash: `0x${string}`;
  }[];
};
/**
 * EIP7715
 */
export const DEFAULT_EIP7715_METHODS = {
  WALLET_GRANT_PERMISSIONS: "wallet_grantPermissions",
} as const;
export type WalletGrantPermissionsParameters = {
  signer?:
    | {
        type: string;
        data?: unknown | undefined;
      }
    | undefined;
  permissions: readonly {
    data: unknown;
    policies: readonly {
      data: unknown;
      type: string;
    }[];
    required?: boolean | undefined;
    type: string;
  }[];
  expiry: number;
};

export type WalletGrantPermissionsReturnType = {
  expiry: number;
  factory?: `0x${string}` | undefined;
  factoryData?: string | undefined;
  grantedPermissions: readonly {
    data: unknown;
    policies: readonly {
      data: unknown;
      type: string;
    }[];
    required?: boolean | undefined;
    type: string;
  }[];
  permissionsContext: string;
  signerData?:
    | {
        userOpBuilder?: `0x${string}` | undefined;
        submitToAddress?: `0x${string}` | undefined;
      }
    | undefined;
};
/**
 * EIP155
 */
export const DEFAULT_EIP155_METHODS = {
  ETH_SEND_TRANSACTION: "eth_sendTransaction",
  PERSONAL_SIGN: "personal_sign",
};

export const DEFAULT_EIP155_OPTIONAL_METHODS = {
  ETH_SIGN_TRANSACTION: "eth_signTransaction",
  ETH_SIGN: "eth_sign",
  ETH_SIGN_TYPED_DATA: "eth_signTypedData",
  ETH_SIGN_TYPED_DATA_V4: "eth_signTypedData_v4",
} as const;

export const DEFAULT_OPTIONAL_METHODS = {
  ...DEFAULT_EIP155_OPTIONAL_METHODS,
  ...DEFAULT_EIP5792_METHODS,
  ...DEFAULT_EIP7715_METHODS,
};

export enum DEFAULT_EIP_155_EVENTS {
  ETH_CHAIN_CHANGED = "chainChanged",
  ETH_ACCOUNTS_CHANGED = "accountsChanged",
}

/**
 * COSMOS
 */
export enum DEFAULT_COSMOS_METHODS {
  COSMOS_SIGN_DIRECT = "cosmos_signDirect",
  COSMOS_SIGN_AMINO = "cosmos_signAmino",
}

export enum DEFAULT_COSMOS_EVENTS {}

/**
 * SOLANA
 */
export enum DEFAULT_SOLANA_METHODS {
  SOL_SIGN_TRANSACTION = "solana_signTransaction",
  SOL_SIGN_MESSAGE = "solana_signMessage",
}

export enum DEFAULT_SOLANA_EVENTS {}

/**
 * POLKADOT
 */
export enum DEFAULT_POLKADOT_METHODS {
  POLKADOT_SIGN_TRANSACTION = "polkadot_signTransaction",
  POLKADOT_SIGN_MESSAGE = "polkadot_signMessage",
}

export enum DEFAULT_POLKADOT_EVENTS {}

/**
 * NEAR
 */
export enum DEFAULT_NEAR_METHODS {
  NEAR_SIGN_IN = "near_signIn",
  NEAR_SIGN_OUT = "near_signOut",
  NEAR_GET_ACCOUNTS = "near_getAccounts",
  NEAR_SIGN_AND_SEND_TRANSACTION = "near_signAndSendTransaction",
  NEAR_SIGN_AND_SEND_TRANSACTIONS = "near_signAndSendTransactions",
}

export enum DEFAULT_NEAR_EVENTS {}

/**
 * MULTIVERSX
 */
export enum DEFAULT_MULTIVERSX_METHODS {
  MULTIVERSX_SIGN_TRANSACTION = "mvx_signTransaction",
  MULTIVERSX_SIGN_TRANSACTIONS = "mvx_signTransactions",
  MULTIVERSX_SIGN_MESSAGE = "mvx_signMessage",
  MULTIVERSX_SIGN_LOGIN_TOKEN = "mvx_signLoginToken",
  MULTIVERSX_SIGN_NATIVE_AUTH_TOKEN = "mvx_signNativeAuthToken",
  MULTIVERSX_CANCEL_ACTION = "mvx_cancelAction",
}

export enum DEFAULT_MULTIVERSX_EVENTS {}

/**
 * TRON
 */
export enum DEFAULT_TRON_METHODS {
  TRON_SIGN_TRANSACTION = "tron_signTransaction",
  TRON_SIGN_MESSAGE = "tron_signMessage",
}

export enum DEFAULT_TRON_EVENTS {}

/**
 * TEZOS
 */
export enum DEFAULT_TEZOS_METHODS {
  TEZOS_GET_ACCOUNTS = "tezos_getAccounts",
  TEZOS_SEND = "tezos_send",
  TEZOS_SIGN = "tezos_sign",
}

export enum DEFAULT_TEZOS_EVENTS {}

export const DEFAULT_GITHUB_REPO_URL =
  "https://github.com/WalletConnect/web-examples/tree/main/dapps/react-dapp-v2";

type RelayerType = {
  value: string | undefined;
  label: string;
};

/**
 * KADENA
 */
export enum DEFAULT_KADENA_METHODS {
  KADENA_GET_ACCOUNTS = "kadena_getAccounts_v1",
  KADENA_SIGN = "kadena_sign_v1",
  KADENA_QUICKSIGN = "kadena_quicksign_v1",
}

export enum DEFAULT_KADENA_EVENTS {}

export const REGIONALIZED_RELAYER_ENDPOINTS: RelayerType[] = [
  {
    value: DEFAULT_RELAY_URL,
    label: "Default",
  },

  {
    value: "wss://us-east-1.relay.walletconnect.com",
    label: "US",
  },
  {
    value: "wss://eu-central-1.relay.walletconnect.com",
    label: "EU",
  },
  {
    value: "wss://ap-southeast-1.relay.walletconnect.com",
    label: "Asia Pacific",
  },
];

export const ORIGIN_OPTIONS = [
  {
    value: getAppMetadata().url,
    label: "VALID",
  },
  {
    value: "https://invalid.origin",
    label: "INVALID",
  },
  {
    value: "unknown",
    label: "UNKNOWN",
  },
];
