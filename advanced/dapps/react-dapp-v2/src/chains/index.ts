import { JsonRpcRequest } from "@walletconnect/jsonrpc-utils";

import * as eip155 from "./eip155";
import * as cosmos from "./cosmos";
import * as polkadot from "./polkadot";
import * as solana from "./solana";
import * as near from "./near";
import * as multiversx from "./multiversx";
import * as tron from "./tron";
import * as tezos from "./tezos";
import * as kadena from "./kadena";
import * as bip122 from "./bip122";

import { ChainMetadata, ChainRequestRender } from "../helpers";

export function getChainMetadata(chainId: string): ChainMetadata {
  const namespace = chainId.split(":")[0];
  switch (namespace) {
    case "eip155":
      return eip155.getChainMetadata(chainId);
    case "cosmos":
      return cosmos.getChainMetadata(chainId);
    case "polkadot":
      return polkadot.getChainMetadata(chainId);
    case "solana":
      return solana.getChainMetadata(chainId);
    case "near":
      return near.getChainMetadata(chainId);
    case "kadena":
      return kadena.getChainMetadata(chainId);
    case "mvx":
      return multiversx.getChainMetadata(chainId);
    case "tron":
      return tron.getChainMetadata(chainId);
    case "tezos":
      return tezos.getChainMetadata(chainId);
    case "bip122":
      return bip122.getChainMetadata(chainId);
    default:
      throw new Error(`No metadata handler for namespace ${namespace}`);
  }
}

export function getChainRequestRender(
  request: JsonRpcRequest,
  chainId: string
): ChainRequestRender[] {
  const namespace = chainId.split(":")[0];
  switch (namespace) {
    case "eip155":
      return eip155.getChainRequestRender(request);
    case "cosmos":
      return cosmos.getChainRequestRender(request);
    case "polkadot":
      return polkadot.getChainRequestRender(request);
    case "near":
      return near.getChainRequestRender(request);
    case "tezos":
      return tezos.getChainRequestRender(request);
    case "kadena":
      return kadena.getChainRequestRender(request);
    default:
      throw new Error(`No render handler for namespace ${namespace}`);
  }
}
