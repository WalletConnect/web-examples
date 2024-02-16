import SignClient from "@walletconnect/sign-client";
import { ISignClient, PairingTypes, SessionTypes } from "@walletconnect/types";
import UniversalProvider, { IUniversalProvider } from "@walletconnect/universal-provider";
import { Web3Modal } from "@web3modal/standalone";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_NEAR_METHODS,
  DEFAULT_LOGGER,
  DEFAULT_PROJECT_ID,
  DEFAULT_RELAY_URL,
} from "../constants";
import { AccountBalances, ChainNamespaces, getAllChainNamespaces } from "../helpers";
// import { apiGetChainNamespace, ChainsMap } from "caip-api";

/**
 * Types
 */
interface IContext {
  client: ISignClient | undefined;
  session: SessionTypes.Struct | undefined;
  disconnect: () => Promise<void>;
  isInitializing: boolean;
  chain: string;
  pairings: PairingTypes.Struct[];
  accounts: string[];
  balances: AccountBalances;
  chainData: ChainNamespaces;
  onEnable: (chainId: string) => Promise<void>;
  nearProvider?: IUniversalProvider;
}

/**
 * Context
 */
export const ClientContext = createContext<IContext>({} as IContext);

/**
 * Provider
 */
export function ClientContextProvider({ children }: { children: ReactNode | ReactNode[] }) {
  const [client, setClient] = useState<ISignClient>();
  const [pairings, setPairings] = useState<PairingTypes.Struct[]>([]);
  const [session, setSession] = useState<SessionTypes.Struct>();
  const [web3Modal, setWeb3Modal] = useState<Web3Modal>();

  const [nearProvider, setNearProvider] = useState<UniversalProvider>();

  const [isInitializing, setIsInitializing] = useState(false);
  const [hasCheckedPersistedSession, setHasCheckedPersistedSession] = useState(false);

  const [balances, setBalances] = useState<AccountBalances>({});
  const [accounts, setAccounts] = useState<string[]>([]);
  const [chainData, setChainData] = useState<ChainNamespaces>({});
  const [chain, setChain] = useState<string>("");

  const resetApp = () => {
    setPairings([]);
    setSession(undefined);
    setBalances({});
    setAccounts([]);
    setChain("");
  };

  const loadChainData = async () => {
    setChainData({
      near: {
        testnet: {
          name: "NEAR Testnet",
          id: "near:testnet",
          rpc: ["https://rpc.testnet.near.org"],
          slip44: 397,
          testnet: true,
        },
      }
    });

    // TODO: Check with WalletConnect team on how to add NEAR to CAIP-API and load NEAR data dynamically and remove above hard-coded code.
    return;

    // const namespaces = getAllChainNamespaces();
    // const chainData: ChainNamespaces = {};
    // await Promise.all(
    //   namespaces.map(async namespace => {
    //     let chains: ChainsMap | undefined;
    //     try {
    //       chains = await apiGetChainNamespace(namespace);
    //     } catch (e) {
    //       // ignore error
    //     }
    //     if (typeof chains !== "undefined") {
    //       chainData[namespace] = chains;
    //     }
    //   }),
    // );
    // setChainData(chainData);
  };

  const disconnect = useCallback(async () => {
    if (typeof nearProvider === "undefined") {
      throw new Error("nearProvider is not initialized");
    }
    nearProvider.disconnect();
    resetApp();
  }, [nearProvider]);

  const onSessionConnected = useCallback(async (_session: SessionTypes.Struct) => {
    setSession(_session);
  }, []);

  const _subscribeToProviderEvents = useCallback(
    async (provider: UniversalProvider) => {
      provider.on("display_uri", async (uri: string) => {
        console.log("EVENT", "QR Code Modal open", uri);
        web3Modal?.openModal({ uri });
      });

      provider.on("session_delete", () => {
        console.log("EVENT", "session_deleted");
        resetApp();
      });
    },
    [web3Modal],
  );

  const createClient = useCallback(async () => {
    try {
      setIsInitializing(true);

      const provider = await UniversalProvider.init({
        projectId: DEFAULT_PROJECT_ID,
        logger: DEFAULT_LOGGER,
        relayUrl: DEFAULT_RELAY_URL,
      });

      setNearProvider(provider);
      setClient(provider.client);

      const web3Modal = new Web3Modal({
        projectId: DEFAULT_PROJECT_ID || "",
        walletConnectVersion: 2,
      });

      setWeb3Modal(web3Modal);
    } catch (err) {
      throw err;
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const onEnable = useCallback(
    async (caipChainId: string) => {
      if (!nearProvider) {
        throw new ReferenceError("WalletConnect Client is not initialized.");
      }

      const chainId = caipChainId.split(":").pop();

      if (!chainId) {
        throw new Error("Could not derive chainId from CAIP chainId");
      }

      console.log("Enabling nearProvider for chainId: ", chainId);

      //  Create WalletConnect Provider
      const session = await nearProvider.connect({
        namespaces: {
          near: {
            methods: DEFAULT_NEAR_METHODS,
            chains: [caipChainId],
            events: ["chainChanged", "accountsChanged"],
          },
        },
      });

      const _accounts = await nearProvider.enable();
      setAccounts(_accounts);
      setSession(session);
      onSessionConnected(session!);
      setChain(caipChainId);

      web3Modal?.closeModal();
    },
    [nearProvider, onSessionConnected, web3Modal],
  );

  const _checkForPersistedSession = useCallback(
    async (provider: IUniversalProvider) => {
      if (!provider) {
        throw new Error("Universal Provider is not initialized");
      }
      // populates existing pairings to state
      setPairings(provider.client!.pairing.getAll({ active: true }));
      if (typeof session !== "undefined") return;
      // populates existing session to state (assume only the top one)
      if (provider.session) {
        console.log("provider.session", provider.session);
        const session = provider.session;

        const accounts = session.namespaces[Object.keys(session.namespaces)[0]].accounts;
        const [namespace, chainId] = accounts[0].split(":");
        const caipChainId = `${namespace}:${chainId}`;
        setAccounts(accounts);
        setSession(session);
        setChain(caipChainId);
        onSessionConnected(session!);
      }
    },
    [session, onSessionConnected],
  );

  useEffect(() => {
    loadChainData();
  }, []);

  useEffect(() => {
    if (!client) {
      createClient();
    }
  }, [client, createClient]);

  useEffect(() => {
    if (nearProvider && web3Modal) _subscribeToProviderEvents(nearProvider);
  }, [_subscribeToProviderEvents, nearProvider, web3Modal]);

  useEffect(() => {
    const getPersistedSession = async () => {
      if (nearProvider && !hasCheckedPersistedSession) {
        await _checkForPersistedSession(nearProvider);
        setHasCheckedPersistedSession(true);
      }
    };

    getPersistedSession();
  }, [nearProvider, _checkForPersistedSession, hasCheckedPersistedSession]);

  const value = useMemo(
    () => ({
      pairings,
      isInitializing,
      balances,
      accounts,
      chain,
      client,
      session,
      disconnect,
      chainData,
      onEnable,
      nearProvider,
    }),
    [
      pairings,
      isInitializing,
      balances,
      accounts,
      chain,
      client,
      session,
      disconnect,
      chainData,
      onEnable,
      nearProvider,
    ],
  );

  return (
    <ClientContext.Provider
      value={{
        ...value,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useWalletConnectClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error("useWalletConnectClient must be used within a ClientContextProvider");
  }
  return context;
}
