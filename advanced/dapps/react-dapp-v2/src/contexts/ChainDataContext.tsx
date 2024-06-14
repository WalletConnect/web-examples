import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { SolanaChainData } from "../chains/solana";
import { PolkadotChainData } from "../chains/polkadot";
import { MultiversxChainData } from "../chains/multiversx";
import { TronChainData } from "../chains/tron";

import { ChainNamespaces, ChainsMap, getAllChainNamespaces } from "../helpers";
import { NearChainData } from "../chains/near";
import { CosmosChainData } from "../chains/cosmos";
import { EIP155ChainData } from "../chains/eip155";
import { TezosChainData } from "../chains/tezos";
import { KadenaChainData } from "../chains/kadena";
import { BtcChainData } from "../chains/bip122";

/**
 * Types
 */
interface IContext {
  chainData: ChainNamespaces;
}

/**
 * Context
 */
export const ChainDataContext = createContext<IContext>({} as IContext);

/**
 * Provider
 */
export function ChainDataContextProvider({
  children,
}: {
  children: ReactNode | ReactNode[];
}) {
  const [chainData, setChainData] = useState<ChainNamespaces>({});

  const loadChainData = async () => {
    const namespaces = getAllChainNamespaces();
    const chainData: ChainNamespaces = {};
    await Promise.all(
      namespaces.map(async (namespace) => {
        let chains: ChainsMap | undefined;
        switch (namespace) {
          case "solana":
            chains = SolanaChainData;
            break;
          case "polkadot":
            chains = PolkadotChainData;
            break;
          case "near":
            chains = NearChainData;
            break;
          case "mvx":
            chains = MultiversxChainData;
            break;
          case "tron":
            chains = TronChainData;
            break;
          case "cosmos":
            chains = CosmosChainData;
            break;
          case "eip155":
            chains = EIP155ChainData;
            break;
          case "tezos":
            chains = TezosChainData;
            break;
          case "kadena":
            chains = KadenaChainData;
            break;
          case "bip122":
            chains = BtcChainData;
            break;
          default:
            console.error("Unknown chain namespace: ", namespace);
        }

        if (typeof chains !== "undefined") {
          chainData[namespace] = chains;
        }
      })
    );

    setChainData(chainData);
  };

  useEffect(() => {
    loadChainData();
  }, []);

  return (
    <ChainDataContext.Provider
      value={{
        chainData,
      }}
    >
      {children}
    </ChainDataContext.Provider>
  );
}

export function useChainData() {
  const context = useContext(ChainDataContext);
  if (context === undefined) {
    throw new Error(
      "useChainData must be used within a ChainDataContextProvider"
    );
  }
  return context;
}
