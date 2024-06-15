import React, { useState } from "react";
import { RELAYER_SDK_VERSION as version } from "@walletconnect/core";

import Banner from "./../components/Banner";
import Blockchain from "./../components/Blockchain";
import Column from "./../components/Column";
import Header from "./../components/Header";
import Modal from "./../components/Modal";
import { DEFAULT_TEST_CHAINS } from "./../constants";
import { AccountAction } from "./../helpers";
import RequestModal from "./../modals/RequestModal";
import PingModal from "./../modals/PingModal";
import {
  SAccounts,
  SAccountsContainer,
  SButtonContainer,
  SContent,
  SLanding,
  SLayout,
} from "./../components/app";
import { useWalletConnectClient } from "./../contexts/ClientContext";

interface IFormattedRpcResponse {
  method?: string;
  address?: string;
  valid?: boolean;
  result: string;
}

export default function App() {
  const [isRpcRequestPending, setIsRpcRequestPending] = useState(false);
  const [rpcResult, setRpcResult] = useState<IFormattedRpcResponse | null>();

  const [modal, setModal] = useState("");

  const closeModal = () => setModal("");
  const openPingModal = () => setModal("ping");
  const openRequestModal = () => setModal("request");

  // Initialize the WalletConnect client.
  const {
    client,
    session,
    disconnect,
    chain,
    accounts,
    balances,
    chainData,
    isInitializing,
    onEnable,
    nearProvider,
  } = useWalletConnectClient();

  const ping = async () => {
    if (typeof client === "undefined") {
      throw new Error("WalletConnect Client is not initialized");
    }

    try {
      setIsRpcRequestPending(true);
      const session = nearProvider?.session;
      if (!session) return;
      await nearProvider.client?.ping({ topic: session.topic! });
      setRpcResult({
        address: "",
        method: "ping",
        valid: true,
        result: "success",
      });
    } catch (error) {
      console.error("RPC request failed:", error);
    } finally {
      setIsRpcRequestPending(false);
    }
  };

  const onPing = async () => {
    openPingModal();
    await ping();
  };

  const testSignAndSendTransactions: (account: string) => Promise<IFormattedRpcResponse> = async account => {
    if (!nearProvider) {
      throw new Error("nearProvider not connected");
    }

    const address = account.split(":").pop();

    if (!address) {
      throw new Error(`Could not derive address from account: ${account}`);
    }

    // test signAndSendTransactions

    const transactions = [
      {
        signerId: address,
        receiverId: "guest-book.testnet",
        actions: [{
          type: "FunctionCall",
          params: {
            methodName: "addMessage",
            args: { text: "Hello from Wallet Connect! (1/2)" },
            gas: "30000000000000",
            deposit: "0",
          }
        }]
      },
      {
        signerId: address,
        receiverId: "guest-book.testnet",
        actions: [{
          type: "FunctionCall",
          params: {
            methodName: "addMessage",
            args: { text: "Hello from Wallet Connect! (2/2)" },
            gas: "30000000000000",
            deposit: "0",
          }
        }]
      }
    ]

    // near_signAndSendTransactions params
    const params = { transactions };

    const result = await nearProvider.request({
      method: "near_signAndSendTransactions",
      params,
    });

    return {
      method: "near_signAndSendTransactions",
      address,
      valid: true,
      result: JSON.stringify((result as any).map((r: any) => r.transaction)),
    };
  };

  const testSignAndSendTransaction: (account: string) => Promise<IFormattedRpcResponse> = async account => {
    if (!nearProvider) {
      throw new Error("nearProvider not connected");
    }

    const address = account.split(":").pop();

    if (!address) {
      throw new Error(`Could not derive address from account: ${account}`);
    }

    // test signAndSendTransaction

    const transaction = {
      signerId: address,
      receiverId: "guest-book.testnet",
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "addMessage",
            args: { text: "Hello from Wallet Connect!" },
            gas: "30000000000000",
            deposit: "0",
          },
        },
      ],
    }

    // near_signAndSendTransaction params
    const params = { transaction };

    const result = await nearProvider.request({
      method: "near_signAndSendTransaction",
      params,
    });

    return {
      method: "near_signAndSendTransaction",
      address,
      valid: true,
      result: JSON.stringify((result as any).transaction),
    };
  };

  const getNearActions = (): AccountAction[] => {
    const wrapRpcRequest =
      (rpcRequest: (account: string) => Promise<IFormattedRpcResponse>) =>
      async (account: string) => {
        openRequestModal();
        try {
          setIsRpcRequestPending(true);
          const result = await rpcRequest(account);
          setRpcResult(result);
        } catch (error) {
          console.error("RPC request failed:", error);
          setRpcResult({ result: (error as Error).message as string });
        } finally {
          setIsRpcRequestPending(false);
        }
      };

    return [
      { method: "near_signAndSendTransaction", callback: wrapRpcRequest(testSignAndSendTransaction) },
      { method: "near_signAndSendTransactions", callback: wrapRpcRequest(testSignAndSendTransactions) },
    ];
  };

  // Renders the appropriate model for the given request that is currently in-flight.
  const renderModal = () => {
    switch (modal) {
      case "request":
        return <RequestModal pending={isRpcRequestPending} result={rpcResult} />;
      case "ping":
        return <PingModal pending={isRpcRequestPending} result={rpcResult} />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    const chainOptions = DEFAULT_TEST_CHAINS;
    return !accounts.length && !Object.keys(balances).length ? (
      <SLanding center>
        <Banner />
        <h6>
          <span>{`Using v${version}`}</span>
        </h6>
        <SButtonContainer>
          <h6>Select NEAR chain:</h6>
          {chainOptions.map(chainId => (
            <Blockchain key={chainId} chainId={chainId} chainData={chainData} onClick={onEnable} />
          ))}
        </SButtonContainer>
      </SLanding>
    ) : (
      <SAccountsContainer>
        <h3>Account</h3>
        <SAccounts>
          {accounts.map(account => {
            return (
              <Blockchain
                key={account}
                active={true}
                chainData={chainData}
                address={account}
                chainId={chain}
                balances={balances}
                actions={getNearActions()}
              />
            );
          })}
        </SAccounts>
      </SAccountsContainer>
    );
  };

  return (
    <SLayout>
      <Column maxWidth={1000} spanHeight>
        <Header ping={onPing} disconnect={disconnect} session={session} />
        <SContent>{isInitializing ? "Loading..." : renderContent()}</SContent>
      </Column>
      <Modal show={!!modal} closeModal={closeModal}>
        {renderModal()}
      </Modal>
    </SLayout>
  );
}
