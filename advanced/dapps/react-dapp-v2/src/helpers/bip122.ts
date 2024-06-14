export async function apiGetBip122AccountBalance(
  address: string,
  chainId: string
) {
  const utxo = await apiGetAddressUtxos(address, chainId);
  const balanceInSatoshis = getAvailableBalanceFromUtxos(utxo);
  const balanceInBtc = balanceInSatoshis * 0.00000001;
  return { balance: balanceInBtc.toString(), symbol: "BTC", name: "BTC" };
}

export async function apiGetAddressUtxos(address: string, chainId: string) {
  return await (
    await fetch(`https://mempool.space/signet/api/address/${address}/utxo`)
  ).json();
}

export function getAvailableBalanceFromUtxos(utxos: any[]) {
  if (!utxos || !utxos.length) {
    return 0;
  }
  return utxos.reduce((acc, { value }) => acc + value, 0);
}
