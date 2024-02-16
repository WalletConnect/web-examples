export const DEFAULT_MAIN_CHAINS = [
  // mainnets
  "cosmos:cosmoshub-4",
];

export const DEFAULT_TEST_CHAINS = [
  // testnets
  "near:testnet",
];

export const DEFAULT_CHAINS = [...DEFAULT_TEST_CHAINS];

export const DEFAULT_PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID;

export const DEFAULT_INFURA_ID = process.env.NEXT_PUBLIC_INFURA_ID;

export const DEFAULT_RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL;

export const DEFAULT_EIP155_METHODS = ["eth_sendTransaction", "personal_sign", "eth_signTypedData"];

export const DEFAULT_COSMOS_METHODS = ["cosmos_signDirect", "cosmos_signAmino"];

export const DEFAULT_NEAR_METHODS = [
  "near_signIn",
  "near_signOut",
  "near_getAccounts",
  "near_signTransaction",
  "near_signTransactions",
  "near_signAndSendTransaction",
  "near_signAndSendTransactions",
  "near_verifyOwner",
];

export const DEFAULT_LOGGER = "debug";

export const DEFAULT_APP_METADATA = {
  name: "React App",
  description: "React App for WalletConnect",
  url: "https://walletconnect.com/",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};
