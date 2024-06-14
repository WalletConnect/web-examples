import * as React from "react";
import styled from "styled-components";

import Icon from "./Icon";

import { AssetData, fromWad } from "../helpers";

import { getChainMetadata } from "../chains";

const xdaiLogo = getChainMetadata("eip155:100").logo;
const maticLogo = getChainMetadata("eip155:137").logo;
const kadenaLogo = getChainMetadata("kadena:testnet04").logo;
const btcLogo = getChainMetadata(
  "bip122:000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943"
).logo;

const SAsset = styled.div`
  width: 100%;
  padding: 20px;
  display: flex;
  justify-content: space-between;
`;
const SAssetLeft = styled.div`
  display: flex;
`;

const SAssetName = styled.div`
  display: flex;
  margin-left: 10px;
`;

const SAssetRight = styled.div`
  display: flex;
`;

const SAssetBalance = styled.div`
  display: flex;
`;

function getAssetIcon(asset: AssetData): JSX.Element {
  if (!!asset.contractAddress) {
    const src = `https://raw.githubusercontent.com/TrustWallet/tokens/master/tokens/${asset.contractAddress.toLowerCase()}.png`;
    return <Icon src={src} fallback={"/assets/erc20.svg"} />;
  }
  switch (asset.symbol.toLowerCase()) {
    case "eth":
      return <Icon src={"/assets/eth.svg"} />;
    case "xdai":
      return <Icon src={xdaiLogo} />;
    case "matic":
      return <Icon src={maticLogo} />;
    case "kda":
      return <Icon src={kadenaLogo} />;
    case "btc":
      return <Icon src={btcLogo} />;
    default:
      return <Icon src={"/assets/eth20.svg"} />;
  }
}

interface AssetProps {
  asset: AssetData;
}

const Asset = (props: AssetProps) => {
  const { asset } = props;
  return (
    <SAsset {...props}>
      <SAssetLeft>
        {getAssetIcon(asset)}
        <SAssetName>{asset.name}</SAssetName>
      </SAssetLeft>
      <SAssetRight>
        <SAssetBalance>
          {fromWad(asset.balance || "0")} {asset.symbol}
        </SAssetBalance>
      </SAssetRight>
    </SAsset>
  );
};

export default Asset;
