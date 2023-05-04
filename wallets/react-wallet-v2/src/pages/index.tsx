import AccountCard from '@/components/AccountCard'
import AccountPicker from '@/components/AccountPicker'
import PageHeader from '@/components/PageHeader'
import { COSMOS_MAINNET_CHAINS } from '@/data/COSMOSData'
import { EIP155_MAINNET_CHAINS, EIP155_TEST_CHAINS } from '@/data/EIP155Data'
import { SOLANA_MAINNET_CHAINS, SOLANA_TEST_CHAINS } from '@/data/SolanaData'
import { POLKADOT_MAINNET_CHAINS, POLKADOT_TEST_CHAINS } from '@/data/PolkadotData'
import { ELROND_MAINNET_CHAINS, ELROND_TEST_CHAINS } from '@/data/ElrondData'
import { TRON_MAINNET_CHAINS, TRON_TEST_CHAINS } from '@/data/TronData'
import SettingsStore from '@/store/SettingsStore'
import { Text } from '@nextui-org/react'
import { Fragment } from 'react'
import { useSnapshot } from 'valtio'
import { NEAR_TEST_CHAINS } from '@/data/NEARData'
import { TEZOS_MAINNET_CHAINS, TEZOS_TEST_CHAINS } from '@/data/TezosData'

export default function HomePage() {
  const {
    testNets,
    eip155Address,
    cosmosAddress,
    solanaAddress,
    polkadotAddress,
    nearAddress,
    elrondAddress,
    tronAddress,
    tezosAddress
  } = useSnapshot(SettingsStore.state)

  return (
    <Fragment>
      <PageHeader title="Accounts">
        <AccountPicker />
      </PageHeader>
      <Text h4 css={{ marginBottom: '$5' }}>
        Mainnets
      </Text>
      {Object.entries(EIP155_MAINNET_CHAINS).map(([caip10, {name, logo, rgb}]) => (
        <AccountCard key={name} name={name} logo={logo} rgb={rgb} address={eip155Address} chainId={caip10.toString()}/>
      ))}
      {Object.entries(COSMOS_MAINNET_CHAINS).map(([caip10, {name, logo, rgb}]) => (
        <AccountCard key={name} name={name} logo={logo} rgb={rgb} address={cosmosAddress} chainId={caip10}/>
      ))}
      {Object.entries(SOLANA_MAINNET_CHAINS).map(([caip10, {name, logo, rgb}]) => (
        <AccountCard key={name} name={name} logo={logo} rgb={rgb} address={solanaAddress} chainId={caip10}/>
      ))}
      {Object.entries(POLKADOT_MAINNET_CHAINS).map(([caip10, {name, logo, rgb}]) => (
        <AccountCard key={name} name={name} logo={logo} rgb={rgb} address={polkadotAddress} chainId={caip10}/>
      ))}
      {Object.entries(ELROND_MAINNET_CHAINS).map(([caip10, {name, logo, rgb}]) => (
        <AccountCard key={name} name={name} logo={logo} rgb={rgb} address={elrondAddress} chainId={caip10}/>
      ))}
      {Object.entries(TRON_MAINNET_CHAINS).map(([caip10, {name, logo, rgb}]) => (
        <AccountCard key={name} name={name} logo={logo} rgb={rgb} address={tronAddress} chainId={caip10}/>
      ))}
      {Object.entries(TEZOS_MAINNET_CHAINS).map(([caip10, {name, logo, rgb}]) => (
        <AccountCard key={name} name={name} logo={logo} rgb={rgb} address={tezosAddress} chainId={caip10}/>
      ))}

      {testNets ? (
        <Fragment>
          <Text h4 css={{ marginBottom: '$5' }}>
            Testnets
          </Text>
          {Object.entries(EIP155_TEST_CHAINS).map(([caip10, {name, logo, rgb}]) => (
            <AccountCard key={name} name={name} logo={logo} rgb={rgb} address={eip155Address} chainId={caip10.toString()}/>
          ))}
          {Object.entries(SOLANA_TEST_CHAINS).map(([caip10, {name, logo, rgb}]) => (
            <AccountCard key={name} name={name} logo={logo} rgb={rgb} address={solanaAddress} chainId={caip10}/>
          ))}
          {Object.entries(POLKADOT_TEST_CHAINS).map(([caip10, {name, logo, rgb}]) => (
            <AccountCard key={name} name={name} logo={logo} rgb={rgb} address={polkadotAddress} chainId={caip10}/>
          ))}
          {Object.entries(NEAR_TEST_CHAINS).map(([caip10, {name, logo, rgb}]) => (
            <AccountCard key={name} name={name} logo={logo} rgb={rgb} address={nearAddress} chainId={caip10}/>
          ))}
          {Object.entries(ELROND_TEST_CHAINS).map(([caip10, {name, logo, rgb}]) => (
            <AccountCard key={name} name={name} logo={logo} rgb={rgb} address={elrondAddress} chainId={caip10}/>
          ))}
          {Object.entries(TRON_TEST_CHAINS).map(([caip10, {name, logo, rgb}]) => (
            <AccountCard key={name} name={name} logo={logo} rgb={rgb} address={tronAddress} chainId={caip10}/>
          ))}
          {Object.entries(TEZOS_TEST_CHAINS).map(([caip10, {name, logo, rgb}]) => (
            <AccountCard key={name} name={name} logo={logo} rgb={rgb} address={tezosAddress} chainId={caip10}/>
          ))}
        </Fragment>
      ) : null}
    </Fragment>
  )
}
