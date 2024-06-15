import { JsonRpcRequest } from "@walletconnect/jsonrpc-utils";

import { NamespaceMetadata, ChainMetadata, ChainRequestRender } from "../helpers";

export const NearMetadata: NamespaceMetadata = {
  "testnet": {
    logo: "https://avatars.githubusercontent.com/u/7613128?s=200&v=4",
    rgb: "27, 31, 53",
  },
};

export function getChainMetadata(chainId: string): ChainMetadata {
  const reference = chainId.split(":")[1];
  const metadata = NearMetadata[reference];
  if (typeof metadata === "undefined") {
    throw new Error(`No chain metadata found for chainId: ${chainId}`);
  }
  return metadata;
}

export function getChainRequestRender(request: JsonRpcRequest): ChainRequestRender[] {
  let params = [{ label: "Method", value: request.method }];

  switch (request.method) {
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
