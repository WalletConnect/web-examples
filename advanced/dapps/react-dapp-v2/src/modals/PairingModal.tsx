import * as React from "react";

import { PairingTypes } from "@walletconnect/types";

import Button from "../components/Button";
import Pairing from "../components/Pairing";
import { STable } from "../components/shared";

import { SModalContainer, SModalTitle } from "./shared";
import LoaderModal from "./LoaderModal";
import toast from "react-hot-toast";

interface PairingModalProps {
  pairings: PairingTypes.Struct[];
  connect: (pairing?: { topic: string }) => Promise<void>;
  disconnectPairing: (pairing?: { topic: string }) => Promise<void>;
}

const PairingModal = (props: PairingModalProps) => {
  const { pairings, connect, disconnectPairing } = props;
  const [pairing, setPairing] = React.useState<PairingTypes.Struct>();

  const onConnect = React.useCallback(
    async (pairing: PairingTypes.Struct) => {
      try {
        setPairing(pairing);
        await connect({ topic: pairing.topic });
      } catch (error) {
        toast.error((error as Error).message, {
          position: "bottom-left",
        });
        setPairing(undefined);
      }
    },
    [connect]
  );
  return pairing ? (
    <LoaderModal
      title={`Connecting to ${pairing?.peerMetadata?.name}`}
      text="Open your wallet to approve the connection request"
    />
  ) : (
    <SModalContainer>
      <SModalTitle>{"Select available pairing or create new one"}</SModalTitle>
      <STable>
        {pairings.map((pairing) => (
          <div key={pairing.topic} style={{ display: "flex" }}>
            <Pairing pairing={pairing} onClick={() => onConnect(pairing)} />
            <span
              style={{ margin: "auto 20px", cursor: "pointer" }}
              onClick={() => disconnectPairing(pairing)}
            >
              X
            </span>
          </div>
        ))}
      </STable>
      <Button onClick={() => connect()}>{`New Pairing`}</Button>
    </SModalContainer>
  );
};

export default PairingModal;
