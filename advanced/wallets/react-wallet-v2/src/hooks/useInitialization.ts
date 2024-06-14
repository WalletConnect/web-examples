import SettingsStore from '@/store/SettingsStore'
import { createOrRestoreCosmosWallet } from '@/utils/CosmosWalletUtil'
import { createOrRestoreEIP155Wallet } from '@/utils/EIP155WalletUtil'
import { createOrRestoreSolanaWallet } from '@/utils/SolanaWalletUtil'
import { createOrRestorePolkadotWallet } from '@/utils/PolkadotWalletUtil'
import { createOrRestoreNearWallet } from '@/utils/NearWalletUtil'
import { createOrRestoreMultiversxWallet } from '@/utils/MultiversxWalletUtil'
import { createOrRestoreTronWallet } from '@/utils/TronWalletUtil'
import { createOrRestoreTezosWallet } from '@/utils/TezosWalletUtil'
import { createWeb3Wallet, web3wallet } from '@/utils/WalletConnectUtil'
import { createOrRestoreKadenaWallet } from '@/utils/KadenaWalletUtil'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import useSmartAccounts from './useSmartAccounts'
import { createOrRestoreBip122Wallet } from '@/utils/Bip122WalletUtil'

export default function useInitialization() {
  const [initialized, setInitialized] = useState(false)
  const prevRelayerURLValue = useRef<string>('')

  const { relayerRegionURL } = useSnapshot(SettingsStore.state)
  const { initializeSmartAccounts } = useSmartAccounts()

  const onInitialize = useCallback(async () => {
    try {
      const { eip155Addresses, eip155Wallets } = createOrRestoreEIP155Wallet()
      const { cosmosAddresses } = await createOrRestoreCosmosWallet()
      const { solanaAddresses } = await createOrRestoreSolanaWallet()
      const { polkadotAddresses } = await createOrRestorePolkadotWallet()
      const { nearAddresses } = await createOrRestoreNearWallet()
      const { multiversxAddresses } = await createOrRestoreMultiversxWallet()
      const { tronAddresses } = await createOrRestoreTronWallet()
      const { tezosAddresses } = await createOrRestoreTezosWallet()
      const { kadenaAddresses } = await createOrRestoreKadenaWallet()
      const { bip122Addresses } = await createOrRestoreBip122Wallet()
      await initializeSmartAccounts(eip155Wallets[eip155Addresses[0]].getPrivateKey())

      SettingsStore.setEIP155Address(eip155Addresses[0])
      SettingsStore.setCosmosAddress(cosmosAddresses[0])
      SettingsStore.setSolanaAddress(solanaAddresses[0])
      SettingsStore.setPolkadotAddress(polkadotAddresses[0])
      SettingsStore.setNearAddress(nearAddresses[0])
      SettingsStore.setMultiversxAddress(multiversxAddresses[0])
      SettingsStore.setTronAddress(tronAddresses[0])
      SettingsStore.setTezosAddress(tezosAddresses[0])
      SettingsStore.setKadenaAddress(kadenaAddresses[0])
      SettingsStore.setbip122Address(bip122Addresses[0])
      await createWeb3Wallet(relayerRegionURL)
      setInitialized(true)
    } catch (err: unknown) {
      console.error('Initialization failed', err)
      alert(err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relayerRegionURL])

  // restart transport if relayer region changes
  const onRelayerRegionChange = useCallback(() => {
    try {
      web3wallet?.core?.relayer.restartTransport(relayerRegionURL)
      prevRelayerURLValue.current = relayerRegionURL
    } catch (err: unknown) {
      alert(err)
    }
  }, [relayerRegionURL])

  useEffect(() => {
    if (!initialized) {
      onInitialize()
    }
    if (prevRelayerURLValue.current !== relayerRegionURL) {
      onRelayerRegionChange()
    }
  }, [initialized, onInitialize, relayerRegionURL, onRelayerRegionChange])

  return initialized
}
