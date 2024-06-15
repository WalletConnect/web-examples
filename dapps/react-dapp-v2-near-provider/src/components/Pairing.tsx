import * as React from "react";
import styled from "styled-components";

import { PairingTypes } from "@walletconnect/types";

import Peer from "./Peer";

interface PairingProps {
  pairing: PairingTypes.Struct;
  onClick?: any;
}

const SPairingContainer = styled.div`
  width: 100%;
  cursor: pointer;
`;

const Pairing = (props: PairingProps) => {
  const { peerMetadata } = props.pairing;
  return (
    <SPairingContainer onClick={props.onClick}>
      <div>
        {typeof peerMetadata !== "undefined" ? (
          <Peer oneLiner metadata={peerMetadata} />
        ) : (
          <div>{`Unknown`}</div>
        )}
      </div>
    </SPairingContainer>
  );
};

export default Pairing;
