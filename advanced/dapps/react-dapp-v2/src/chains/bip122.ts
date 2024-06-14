import { NamespaceMetadata, ChainMetadata, ChainsMap } from "../helpers";

export const BtcChainData: ChainsMap = {
  "000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943": {
    id: "bip122:000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943",
    name: "BTC Signet",
    rpc: [],
    slip44: 501,
    testnet: true,
  },
};

export const BtcMetadata: NamespaceMetadata = {
  "000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943": {
    logo: "/assets/btc-testnet.png",
    rgb: "247, 147, 25",
  },
};

export function getChainMetadata(chainId: string): ChainMetadata {
  const reference = chainId.split(":")[1];
  const metadata = BtcMetadata[reference];
  if (typeof metadata === "undefined") {
    throw new Error(`No chain metadata found for chainId: ${chainId}`);
  }
  return metadata;
}
