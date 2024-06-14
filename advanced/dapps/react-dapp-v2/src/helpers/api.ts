import axios, { AxiosInstance } from "axios";
import { apiGetKadenaAccountBalance } from "./kadena";

import { AssetData } from "./types";
import { PactCommand } from "@kadena/client";
import { apiGetBip122AccountBalance } from "./bip122";

export type RpcProvidersByChainId = Record<
  number,
  {
    name: string;
    baseURL: string;
    token: {
      name: string;
      symbol: string;
    };
  }
>;

const WALLETCONNECT_RPC_BASE_URL = `https://rpc.walletconnect.com/v1?projectId=${process.env.NEXT_PUBLIC_PROJECT_ID}`;

export const rpcProvidersByChainId: RpcProvidersByChainId = {
  1: {
    name: "Ethereum Mainnet",
    baseURL: WALLETCONNECT_RPC_BASE_URL + "&chainId=eip155:1",
    token: {
      name: "Ether",
      symbol: "ETH",
    },
  },
  5: {
    name: "Ethereum Goerli",
    baseURL: WALLETCONNECT_RPC_BASE_URL + "&chainId=eip155:5",
    token: {
      name: "Ether",
      symbol: "ETH",
    },
  },
  11155111: {
    name: "Ethereum Sepolia",
    baseURL: WALLETCONNECT_RPC_BASE_URL + "&chainId=eip155:11155111",
    token: {
      name: "Ether",
      symbol: "ETH",
    },
  },
  137: {
    name: "Polygon Mainnet",
    baseURL: WALLETCONNECT_RPC_BASE_URL + "&chainId=eip155:137",
    token: {
      name: "Matic",
      symbol: "MATIC",
    },
  },
  280: {
    name: "zkSync Era Testnet",
    baseURL: WALLETCONNECT_RPC_BASE_URL + "&chainId=eip155:280",
    token: {
      name: "Ether",
      symbol: "ETH",
    },
  },
  324: {
    name: "zkSync Era",
    baseURL: WALLETCONNECT_RPC_BASE_URL + "&chainId=eip155:324",
    token: {
      name: "Ether",
      symbol: "ETH",
    },
  },
  80001: {
    name: "Polygon Mumbai",
    baseURL: WALLETCONNECT_RPC_BASE_URL + "&chainId=eip155:80001",
    token: {
      name: "Matic",
      symbol: "MATIC",
    },
  },
  10: {
    name: "Optimism",
    baseURL: WALLETCONNECT_RPC_BASE_URL + "&chainId=eip155:10",
    token: {
      name: "Ether",
      symbol: "ETH",
    },
  },
  420: {
    name: "Optimism Goerli",
    baseURL: WALLETCONNECT_RPC_BASE_URL + "&chainId=eip155:420",
    token: {
      name: "Ether",
      symbol: "ETH",
    },
  },
  42161: {
    name: "Arbitrum",
    baseURL: WALLETCONNECT_RPC_BASE_URL + "&chainId=eip155:42161",
    token: {
      name: "Ether",
      symbol: "ETH",
    },
  },
  421611: {
    name: "Arbitrum Rinkeby",
    baseURL: "https://rinkeby.arbitrum.io/rpc",
    token: {
      name: "Ether",
      symbol: "ETH",
    },
  },
  100: {
    name: "xDAI",
    baseURL: "https://xdai-archive.blockscout.com",
    token: {
      name: "xDAI",
      symbol: "xDAI",
    },
  },
  42220: {
    name: "Celo",
    baseURL: "https://rpc.walletconnect.com/v1",
    token: {
      name: "CELO",
      symbol: "CELO",
    },
  },
  44787: {
    name: "Celo Alfajores",
    baseURL: "https://alfajores-forno.celo-testnet.org",
    token: {
      name: "CELO",
      symbol: "CELO",
    },
  },
};

const api: AxiosInstance = axios.create({
  baseURL: "https://rpc.walletconnect.com/v1",
  timeout: 10000, // 10 secs
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export async function apiGetAccountBalance(
  address: string,
  chainId: string
): Promise<AssetData> {
  const [namespace, networkId] = chainId.split(":");

  if (namespace === "kadena") {
    return apiGetKadenaAccountBalance(
      address,
      networkId as PactCommand["networkId"]
    );
  }

  if (namespace === "bip122") {
    return apiGetBip122AccountBalance(address, networkId as string);
  }

  if (namespace !== "eip155") {
    return { balance: "", symbol: "", name: "" };
  }

  const ethChainId = chainId.split(":")[1];
  const rpc = rpcProvidersByChainId[Number(ethChainId)];
  if (!rpc) {
    return { balance: "", symbol: "", name: "" };
  }
  const { baseURL, token } = rpc;
  const response = await api.post(baseURL, {
    jsonrpc: "2.0",
    method: "eth_getBalance",
    params: [address, "latest"],
    id: 1,
  });
  const { result } = response.data;
  const balance = parseInt(result, 16).toString();
  return { balance, ...token };
}

export const apiGetAccountNonce = async (
  address: string,
  chainId: string
): Promise<number> => {
  const ethChainId = chainId.split(":")[1];
  const { baseURL } = rpcProvidersByChainId[Number(ethChainId)];
  const response = await api.post(baseURL, {
    jsonrpc: "2.0",
    method: "eth_getTransactionCount",
    params: [address, "latest"],
    id: 1,
  });
  const { result } = response.data;
  const nonce = parseInt(result, 16);
  return nonce;
};

export const apiGetGasPrice = async (chainId: string): Promise<string> => {
  const ethChainId = chainId.split(":")[1];
  const { baseURL } = rpcProvidersByChainId[Number(ethChainId)];
  const response = await api.post(baseURL, {
    jsonrpc: "2.0",
    method: "eth_gasPrice",
    params: [],
    id: 1,
  });
  const { result } = response.data;
  return result;
};
