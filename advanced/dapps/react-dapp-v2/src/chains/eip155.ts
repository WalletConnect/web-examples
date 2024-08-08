import { JsonRpcRequest } from "@walletconnect/jsonrpc-utils";

import {
  NamespaceMetadata,
  ChainMetadata,
  ChainRequestRender,
  convertHexToNumber,
  convertHexToUtf8,
  ChainsMap,
} from "../helpers";

export const EIP155Colors = {
  ethereum: "99, 125, 234",
  optimism: "233, 1, 1",
  goerli: "189, 174, 155",
  xdai: "73, 169, 166",
  polygon: "130, 71, 229",
  zksync: "90, 90, 90",
  celo: "60, 203, 132",
  arbitrum: "44, 55, 75",
  xdc: "25, 50, 75",

};

export const EIP155ChainData: ChainsMap = {
  "1": {
    name: "Ethereum Mainnet",
    id: "eip155:1",
    rpc: ["https://api.mycryptoapi.com/eth"],
    slip44: 60,
    testnet: false,
  },
  "5": {
    name: "Ethereum Goerli",
    id: "eip155:5",
    rpc: ["https://rpc.goerli.mudit.blog"],
    slip44: 60,
    testnet: true,
  },
  "11155111": {
    name: "Ethereum Sepolia",
    id: "eip155:11155111",
    rpc: ["https://gateway.tenderly.co/public/sepolia	"],
    slip44: 60,
    testnet: true,
  },
  "10": {
    name: "Optimism Mainnet",
    id: "eip155:10",
    rpc: ["https://mainnet.optimism.io"],
    slip44: 60,
    testnet: false,
  },
  "42": {
    name: "Ethereum Kovan",
    id: "eip155:42",
    rpc: ["https://kovan.poa.network"],
    slip44: 60,
    testnet: true,
  },
  "50": {
    name: "XDC Network",
    id: "eip155:50",
    rpc: ["https://rpc1.xinfin.network"],
    slip44: 60,
    testnet: false,
  },
  "51": {
    name: "XDC Apothem TestNet",
    id: "eip155:51",
    rpc: ["https://rpc.apothem.network"],
    slip44: 60,
    testnet: true,
  },
  "69": {
    name: "Optimism Kovan",
    id: "eip155:69",
    rpc: ["https://kovan.optimism.io"],
    slip44: 60,
    testnet: true,
  },
  "100": {
    name: "xDAI",
    id: "eip155:100",
    rpc: ["https://dai.poa.network"],
    slip44: 60,
    testnet: false,
  },
  "280": {
    name: "zkSync Era Testnet",
    id: "eip155:280",
    rpc: ["https://testnet.era.zksync.dev"],
    slip44: 60,
    testnet: true,
  },
  "324": {
    name: "zkSync Era",
    id: "eip155:324",
    rpc: ["https://mainnet.era.zksync.io"],
    slip44: 60,
    testnet: false,
  },
  "137": {
    name: "Polygon Mainnet",
    id: "eip155:137",
    rpc: ["https://rpc-mainnet.matic.network"],
    slip44: 60,
    testnet: false,
  },
  "420": {
    name: "Optimism Goerli",
    id: "eip155:420",
    rpc: ["https://goerli.optimism.io"],
    slip44: 60,
    testnet: true,
  },
  "42161": {
    name: "Arbitrum One",
    id: "eip155:42161",
    rpc: ["https://arb1.arbitrum.io/rpc"],
    slip44: 60,
    testnet: false,
  },
  "42220": {
    name: "Celo Mainnet",
    id: "eip155:42220",
    rpc: ["https://forno.celo.org"],
    slip44: 52752,
    testnet: false,
  },
  "44787": {
    name: "Celo Alfajores",
    id: "eip155:44787",
    rpc: ["https://alfajores-forno.celo-testnet.org"],
    slip44: 52752,
    testnet: true,
  },
  "80001": {
    name: "Polygon Mumbai",
    id: "eip155:80001",
    rpc: ["https://rpc-mumbai.matic.today"],
    slip44: 60,
    testnet: true,
  },
  "421611": {
    name: "Arbitrum Rinkeby",
    id: "eip155:421611",
    rpc: ["https://rinkeby.arbitrum.io/rpc"],
    slip44: 60,
    testnet: true,
  },
};

export const EIP155Metadata: NamespaceMetadata = {
  "1": {
    name: "Ethereum",
    logo: "/assets/" + "eip155-1.png",
    rgb: EIP155Colors.ethereum,
  },
  "5": {
    logo: "/assets/" + "eip155-1.png",
    rgb: EIP155Colors.ethereum,
  },
  "50": {
    name: "XDC Network",
    logo: "/assets/" + "eip155-50.svg",
    rgb: EIP155Colors.xdc,
  },
  "51": {
    name: "XDC Apothem TestNet",
    logo: "/assets/" + "eip155-50.png",
    rgb: EIP155Colors.xdc,
  },
  "11155111": {
    logo: "/assets/" + "eip155-1.png",
    rgb: EIP155Colors.ethereum,
  },
  "10": {
    name: "Optimism",
    logo: "/assets/" + "eip155-10.png",
    rgb: EIP155Colors.optimism,
  },
  "42": {
    logo: "/assets/" + "eip155-42.png",
    rgb: EIP155Colors.ethereum,
  },
  "420": {
    logo: "/assets/" + "eip155-420.png",
    rgb: EIP155Colors.optimism,
  },
  "100": {
    logo: "/assets/" + "eip155-100.png",
    rgb: EIP155Colors.xdai,
  },
  "280": {
    name: "zkSync Era Testnet",
    logo: "/assets/" + "eip155-324.svg",
    rgb: EIP155Colors.zksync,
  },
  "324": {
    name: "zkSync Era",
    logo: "/assets/" + "eip155-324.svg",
    rgb: EIP155Colors.zksync,
  },
  "137": {
    name: "Polygon",
    logo: "/assets/" + "eip155-137.png",
    rgb: EIP155Colors.polygon,
  },
  "80001": {
    logo: "/assets/" + "eip155-80001.png",
    rgb: EIP155Colors.polygon,
  },
  "42161": {
    name: "Arbitrum",
    logo: "/assets/" + "eip155-42161.png",
    rgb: EIP155Colors.arbitrum,
  },
  "42220": {
    name: "Celo",
    logo: "/assets/" + "eip155-42220.png",
    rgb: EIP155Colors.celo,
  },
  "44787": {
    logo: "/assets/" + "eip155-44787.png",
    rgb: EIP155Colors.celo,
  },
  "421611": {
    logo: "/assets/" + "eip155-421611.png",
    rgb: EIP155Colors.arbitrum,
  },
};
export function getChainMetadata(chainId: string): ChainMetadata {
  const reference = chainId.split(":")[1];
  const metadata = EIP155Metadata[reference];
  if (typeof metadata === "undefined") {
    throw new Error(`No chain metadata found for chainId: ${chainId}`);
  }
  return metadata;
}

export function getChainRequestRender(
  request: JsonRpcRequest
): ChainRequestRender[] {
  let params = [{ label: "Method", value: request.method }];

  switch (request.method) {
    case "eth_sendTransaction":
    case "eth_signTransaction":
      params = [
        ...params,
        { label: "From", value: request.params[0].from },
        { label: "To", value: request.params[0].to },
        {
          label: "Gas Limit",
          value: request.params[0].gas
            ? convertHexToNumber(request.params[0].gas)
            : request.params[0].gasLimit
            ? convertHexToNumber(request.params[0].gasLimit)
            : "",
        },
        {
          label: "Gas Price",
          value: convertHexToNumber(request.params[0].gasPrice),
        },
        {
          label: "Nonce",
          value: convertHexToNumber(request.params[0].nonce),
        },
        {
          label: "Value",
          value: request.params[0].value
            ? convertHexToNumber(request.params[0].value)
            : "",
        },
        { label: "Data", value: request.params[0].data },
      ];
      break;

    case "eth_sign":
      params = [
        ...params,
        { label: "Address", value: request.params[0] },
        { label: "Message", value: request.params[1] },
      ];
      break;
    case "personal_sign":
      params = [
        ...params,
        { label: "Address", value: request.params[1] },
        {
          label: "Message",
          value: convertHexToUtf8(request.params[0]),
        },
      ];
      break;
    default:
      params = [
        ...params,
        {
          label: "params",
          value: JSON.stringify(request.params, null, "\t"),
        },
      ];
      break;
  }
  return params;
}
