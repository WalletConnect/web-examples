import { ProposalTypes } from "@walletconnect/types";
import {
  DEFAULT_COSMOS_EVENTS,
  DEFAULT_COSMOS_METHODS,
  DEFAULT_EIP155_METHODS,
  DEFAULT_EIP_155_EVENTS,
  DEFAULT_SOLANA_EVENTS,
  DEFAULT_SOLANA_METHODS,
  DEFAULT_POLKADOT_EVENTS,
  DEFAULT_POLKADOT_METHODS,
  DEFAULT_NEAR_METHODS,
  DEFAULT_NEAR_EVENTS,
  DEFAULT_KADENA_METHODS,
  DEFAULT_KADENA_EVENTS,
  DEFAULT_MULTIVERSX_EVENTS,
  DEFAULT_MULTIVERSX_METHODS,
  DEFAULT_TRON_METHODS,
  DEFAULT_TRON_EVENTS,
  DEFAULT_TEZOS_METHODS,
  DEFAULT_TEZOS_EVENTS,
  DEFAULT_OPTIONAL_METHODS,
  DEFAULT_BIP122_METHODS,
  DEFAULT_BIP122_EVENTS,
} from "../constants";

export const getNamespacesFromChains = (chains: string[]) => {
  const supportedNamespaces: string[] = [];
  chains.forEach((chainId) => {
    const [namespace] = chainId.split(":");
    if (!supportedNamespaces.includes(namespace)) {
      supportedNamespaces.push(namespace);
    }
  });

  return supportedNamespaces;
};

export const getSupportedRequiredMethodsByNamespace = (namespace: string) => {
  switch (namespace) {
    case "eip155":
      return Object.values(DEFAULT_EIP155_METHODS);
    case "cosmos":
      return Object.values(DEFAULT_COSMOS_METHODS);
    case "solana":
      return Object.values(DEFAULT_SOLANA_METHODS);
    case "polkadot":
      return Object.values(DEFAULT_POLKADOT_METHODS);
    case "near":
      return Object.values(DEFAULT_NEAR_METHODS);
    case "mvx":
      return Object.values(DEFAULT_MULTIVERSX_METHODS);
    case "tron":
      return Object.values(DEFAULT_TRON_METHODS);
    case "tezos":
      return Object.values(DEFAULT_TEZOS_METHODS);
    case "kadena":
      return Object.values(DEFAULT_KADENA_METHODS);
    case "bip122":
      return Object.values(DEFAULT_BIP122_METHODS);
    default:
      throw new Error(
        `No default required methods for namespace: ${namespace}`
      );
  }
};

export const getSupportedOptionalMethodsByNamespace = (namespace: string) => {
  switch (namespace) {
    case "eip155":
      return Object.values(DEFAULT_OPTIONAL_METHODS);
    case "cosmos":
    case "solana":
    case "polkadot":
    case "near":
    case "mvx":
    case "tron":
    case "tezos":
    case "kadena":
    case "bip122":
      return [];
    default:
      throw new Error(
        `No default optional methods for namespace: ${namespace}`
      );
  }
};

export const getSupportedEventsByNamespace = (namespace: string) => {
  switch (namespace) {
    case "eip155":
      return Object.values(DEFAULT_EIP_155_EVENTS);
    case "cosmos":
      return Object.values(DEFAULT_COSMOS_EVENTS);
    case "solana":
      return Object.values(DEFAULT_SOLANA_EVENTS);
    case "polkadot":
      return Object.values(DEFAULT_POLKADOT_EVENTS);
    case "near":
      return Object.values(DEFAULT_NEAR_EVENTS);
    case "mvx":
      return Object.values(DEFAULT_MULTIVERSX_EVENTS);
    case "tron":
      return Object.values(DEFAULT_TRON_EVENTS);
    case "tezos":
      return Object.values(DEFAULT_TEZOS_EVENTS);
    case "kadena":
      return Object.values(DEFAULT_KADENA_EVENTS);
    case "bip122":
      return Object.values(DEFAULT_BIP122_EVENTS);
    default:
      throw new Error(`No default events for namespace: ${namespace}`);
  }
};

export const getRequiredNamespaces = (
  chains: string[]
): ProposalTypes.RequiredNamespaces => {
  const selectedNamespaces = getNamespacesFromChains(chains);
  console.log("selected required namespaces:", selectedNamespaces);

  return Object.fromEntries(
    selectedNamespaces.map((namespace) => [
      namespace,
      {
        methods: getSupportedRequiredMethodsByNamespace(namespace),
        chains: chains.filter((chain) => chain.startsWith(namespace)),
        events: getSupportedEventsByNamespace(namespace) as any[],
      },
    ])
  );
};

export const getOptionalNamespaces = (
  chains: string[]
): ProposalTypes.OptionalNamespaces => {
  const selectedNamespaces = getNamespacesFromChains(chains);
  console.log("selected optional namespaces:", selectedNamespaces);

  return Object.fromEntries(
    selectedNamespaces.map((namespace) => [
      namespace,
      {
        methods: getSupportedOptionalMethodsByNamespace(namespace),
        chains: chains.filter((chain) => chain.startsWith(namespace)),
        events: [],
      },
    ])
  );
};
