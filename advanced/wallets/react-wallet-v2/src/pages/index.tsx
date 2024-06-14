import AccountCard from '@/components/AccountCard'
import AccountPicker from '@/components/AccountPicker'
import PageHeader from '@/components/PageHeader'
import { COSMOS_MAINNET_CHAINS } from '@/data/COSMOSData'
import { EIP155_MAINNET_CHAINS, EIP155_TEST_CHAINS } from '@/data/EIP155Data'
import { SOLANA_MAINNET_CHAINS, SOLANA_TEST_CHAINS } from '@/data/SolanaData'
import { POLKADOT_MAINNET_CHAINS, POLKADOT_TEST_CHAINS } from '@/data/PolkadotData'
import { MULTIVERSX_MAINNET_CHAINS, MULTIVERSX_TEST_CHAINS } from '@/data/MultiversxData'
import { TRON_MAINNET_CHAINS, TRON_TEST_CHAINS } from '@/data/TronData'
import { NEAR_TEST_CHAINS } from '@/data/NEARData'
import { TEZOS_MAINNET_CHAINS, TEZOS_TEST_CHAINS } from '@/data/TezosData'
import { KADENA_MAINNET_CHAINS, KADENA_TEST_CHAINS } from '@/data/KadenaData'
import SettingsStore from '@/store/SettingsStore'
import { Text } from '@nextui-org/react'
import { Fragment } from 'react'
import { useSnapshot } from 'valtio'
import useSmartAccounts from '@/hooks/useSmartAccounts'
import { BIP122_CHAINS } from '@/data/Bip122Data'

export default function HomePage() {
  const {
    testNets,
    eip155Address,
    cosmosAddress,
    solanaAddress,
    polkadotAddress,
    nearAddress,
    multiversxAddress,
    tronAddress,
    tezosAddress,
    kadenaAddress,
    bip122Address,
    smartAccountEnabled
  } = useSnapshot(SettingsStore.state)
  const { getAvailableSmartAccounts } = useSmartAccounts()

  return (
    <Fragment>
      <PageHeader title="Accounts">
        <AccountPicker data-testid="account-picker" />
      </PageHeader>
      <Text h4 css={{ marginBottom: '$5' }}>
        Mainnets
      </Text>
      {Object.entries(EIP155_MAINNET_CHAINS).map(([caip10, { name, logo, rgb }]) => (
        <AccountCard
          key={name}
          name={name}
          logo={logo}
          rgb={rgb}
          address={eip155Address}
          chainId={caip10.toString()}
          data-testid={'chain-card-' + caip10.toString()}
        />
      ))}
      {Object.entries(COSMOS_MAINNET_CHAINS).map(([caip10, { name, logo, rgb }]) => (
        <AccountCard
          key={name}
          name={name}
          logo={logo}
          rgb={rgb}
          address={cosmosAddress}
          chainId={caip10}
          data-testid={'chain-card-' + caip10.toString()}
        />
      ))}
      {Object.entries(SOLANA_MAINNET_CHAINS).map(([caip10, { name, logo, rgb }]) => (
        <AccountCard
          key={name}
          name={name}
          logo={logo}
          rgb={rgb}
          address={solanaAddress}
          chainId={caip10}
          data-testid={'chain-card-' + caip10.toString()}
        />
      ))}
      {Object.entries(POLKADOT_MAINNET_CHAINS).map(([caip10, { name, logo, rgb }]) => (
        <AccountCard
          key={name}
          name={name}
          logo={logo}
          rgb={rgb}
          address={polkadotAddress}
          chainId={caip10}
          data-testid={'chain-card-' + caip10.toString()}
        />
      ))}
      {Object.entries(MULTIVERSX_MAINNET_CHAINS).map(([caip10, { name, logo, rgb }]) => (
        <AccountCard
          key={name}
          name={name}
          logo={logo}
          rgb={rgb}
          address={multiversxAddress}
          chainId={caip10}
          data-testid={'chain-card-' + caip10.toString()}
        />
      ))}
      {Object.entries(TRON_MAINNET_CHAINS).map(([caip10, { name, logo, rgb }]) => (
        <AccountCard
          key={name}
          name={name}
          logo={logo}
          rgb={rgb}
          address={tronAddress}
          chainId={caip10}
          data-testid={'chain-card-' + caip10.toString()}
        />
      ))}
      {Object.entries(TEZOS_MAINNET_CHAINS).map(([caip10, { name, logo, rgb }]) => (
        <AccountCard
          key={name}
          name={name}
          logo={logo}
          rgb={rgb}
          address={tezosAddress}
          chainId={caip10}
          data-testid={'chain-card-' + caip10.toString()}
        />
      ))}
      {Object.entries(KADENA_MAINNET_CHAINS).map(([caip10, { name, logo, rgb }]) => (
        <AccountCard
          key={name}
          name={name}
          logo={logo}
          rgb={rgb}
          address={kadenaAddress}
          chainId={caip10}
          data-testid={'chain-card-' + caip10.toString()}
        />
      ))}
      {Object.entries(BIP122_CHAINS).map(([caip10, { name, logo, rgb }]) => (
        <AccountCard
          key={name}
          name={name}
          logo={logo}
          rgb={rgb}
          address={bip122Address}
          chainId={caip10}
          data-testid={'chain-card-' + caip10.toString()}
        />
      ))}

      {testNets ? (
        <Fragment>
          <Text h4 css={{ marginBottom: '$5' }}>
            Testnets
          </Text>
          {Object.entries(EIP155_TEST_CHAINS).map(([caip10, { name, logo, rgb }]) => (
            <AccountCard
              key={name}
              name={name}
              logo={logo}
              rgb={rgb}
              address={eip155Address}
              chainId={caip10.toString()}
              data-testid={'chain-card-' + caip10.toString()}
            />
          ))}
          {Object.entries(EIP155_TEST_CHAINS).map(([caip10, { name, logo, rgb, chainId }]) => {
            if (smartAccountEnabled) {
              return (
                <div key={`${name}-smart`} style={{ marginBottom: 10 }}>
                  {getAvailableSmartAccounts()
                    .filter(account => {
                      return account.chain.id === chainId
                    })
                    .map(account => {
                      return (
                        <AccountCard
                          key={`${name}-${account.type.toLowerCase()}`}
                          name={`${account.type} Smart Account \n ${name}`}
                          logo={logo}
                          rgb={rgb}
                          address={account.address}
                          chainId={caip10.toString()}
                          data-testid={`chain-card-${caip10.toString()}-${account.type.toLowerCase()}`}
                        />
                      )
                    })}
                </div>
              )
            }
          })}
          {Object.entries(SOLANA_TEST_CHAINS).map(([caip10, { name, logo, rgb }]) => (
            <AccountCard
              key={name}
              name={name}
              logo={logo}
              rgb={rgb}
              address={solanaAddress}
              chainId={caip10}
              data-testid={'chain-card-' + caip10.toString()}
            />
          ))}
          {Object.entries(POLKADOT_TEST_CHAINS).map(([caip10, { name, logo, rgb }]) => (
            <AccountCard
              key={name}
              name={name}
              logo={logo}
              rgb={rgb}
              address={polkadotAddress}
              chainId={caip10}
              data-testid={'chain-card-' + caip10.toString()}
            />
          ))}
          {Object.entries(NEAR_TEST_CHAINS).map(([caip10, { name, logo, rgb }]) => (
            <AccountCard
              key={name}
              name={name}
              logo={logo}
              rgb={rgb}
              address={nearAddress}
              chainId={caip10}
              data-testid={'chain-card-' + caip10.toString()}
            />
          ))}
          {Object.entries(MULTIVERSX_TEST_CHAINS).map(([caip10, { name, logo, rgb }]) => (
            <AccountCard
              key={name}
              name={name}
              logo={logo}
              rgb={rgb}
              address={multiversxAddress}
              chainId={caip10}
              data-testid={'chain-card-' + caip10.toString()}
            />
          ))}
          {Object.entries(TRON_TEST_CHAINS).map(([caip10, { name, logo, rgb }]) => (
            <AccountCard
              key={name}
              name={name}
              logo={logo}
              rgb={rgb}
              address={tronAddress}
              chainId={caip10}
              data-testid={'chain-card-' + caip10.toString()}
            />
          ))}
          {Object.entries(TEZOS_TEST_CHAINS).map(([caip10, { name, logo, rgb }]) => (
            <AccountCard
              key={name}
              name={name}
              logo={logo}
              rgb={rgb}
              address={tezosAddress}
              chainId={caip10}
              data-testid={'chain-card-' + caip10.toString()}
            />
          ))}
          {Object.entries(KADENA_TEST_CHAINS).map(([caip10, { name, logo, rgb }]) => (
            <AccountCard
              key={name}
              name={name}
              logo={logo}
              rgb={rgb}
              address={kadenaAddress}
              chainId={caip10}
              data-testid={'chain-card-' + caip10.toString()}
            />
          ))}
        </Fragment>
      ) : null}
    </Fragment>
  )
}
