import { createOrRestoreEIP155Wallet } from '@/utils/EIP155WalletUtil'
import {
  createOrRestoreBiconomySmartAccount,
  createOrRestoreKernelSmartAccount,
  createOrRestoreSafeSmartAccount,
  removeSmartAccount
} from '@/utils/SmartAccountUtil'
import { Verify, SessionTypes } from '@walletconnect/types'
import { proxy } from 'valtio'

const TEST_NETS_ENABLED_KEY = 'TEST_NETS'
const SMART_ACCOUNTS_ENABLED_KEY = 'SMART_ACCOUNTS'
const ZERO_DEV_SMART_ACCOUNTS_ENABLED_KEY = 'ZERO_DEV_SMART_ACCOUNTS'
const SAFE_SMART_ACCOUNTS_ENABLED_KEY = 'SAFE_SMART_ACCOUNTS'
const BICONOMY_SMART_ACCOUNTS_ENABLED_KEY = 'BICONOMY_SMART_ACCOUNTS'

/**
 * Types
 */
interface State {
  testNets: boolean
  account: number
  eip155Address: string
  cosmosAddress: string
  solanaAddress: string
  polkadotAddress: string
  nearAddress: string
  multiversxAddress: string
  tronAddress: string
  tezosAddress: string
  kadenaAddress: string
  bip122Address: string
  kernelSmartAccountAddress: string
  safeSmartAccountAddress: string
  biconomySmartAccountAddress: string
  relayerRegionURL: string
  activeChainId: string
  currentRequestVerifyContext?: Verify.Context
  sessions: SessionTypes.Struct[]
  smartAccountSponsorshipEnabled: boolean
  smartAccountEnabled: boolean
  kernelSmartAccountEnabled: boolean
  safeSmartAccountEnabled: boolean
  biconomySmartAccountEnabled: boolean
}

/**
 * State
 */
const state = proxy<State>({
  testNets:
    typeof localStorage !== 'undefined'
      ? Boolean(localStorage.getItem(TEST_NETS_ENABLED_KEY))
      : true,
  account: 0,
  activeChainId: '1',
  eip155Address: '',
  cosmosAddress: '',
  solanaAddress: '',
  polkadotAddress: '',
  nearAddress: '',
  multiversxAddress: '',
  tronAddress: '',
  tezosAddress: '',
  kadenaAddress: '',
  bip122Address: '',
  kernelSmartAccountAddress: '',
  safeSmartAccountAddress: '',
  biconomySmartAccountAddress: '',
  relayerRegionURL: '',
  sessions: [],
  smartAccountSponsorshipEnabled: false,
  smartAccountEnabled:
    typeof localStorage !== 'undefined'
      ? Boolean(localStorage.getItem(SMART_ACCOUNTS_ENABLED_KEY))
      : false,
  kernelSmartAccountEnabled:
    typeof localStorage !== 'undefined'
      ? Boolean(localStorage.getItem(ZERO_DEV_SMART_ACCOUNTS_ENABLED_KEY))
      : false,
  safeSmartAccountEnabled:
    typeof localStorage !== 'undefined'
      ? Boolean(localStorage.getItem(SAFE_SMART_ACCOUNTS_ENABLED_KEY))
      : false,
  biconomySmartAccountEnabled:
    typeof localStorage !== 'undefined'
      ? Boolean(localStorage.getItem(BICONOMY_SMART_ACCOUNTS_ENABLED_KEY))
      : false
})

/**
 * Store / Actions
 */
const SettingsStore = {
  state,

  setAccount(value: number) {
    state.account = value
  },

  setEIP155Address(eip155Address: string) {
    state.eip155Address = eip155Address
  },

  setCosmosAddress(cosmosAddresses: string) {
    state.cosmosAddress = cosmosAddresses
  },

  setSolanaAddress(solanaAddress: string) {
    state.solanaAddress = solanaAddress
  },

  setPolkadotAddress(polkadotAddress: string) {
    state.polkadotAddress = polkadotAddress
  },
  setNearAddress(nearAddress: string) {
    state.nearAddress = nearAddress
  },
  setKadenaAddress(kadenaAddress: string) {
    state.kadenaAddress = kadenaAddress
  },
  setbip122Address(bip122Address: string) {
    state.bip122Address = bip122Address
  },
  setRelayerRegionURL(relayerRegionURL: string) {
    state.relayerRegionURL = relayerRegionURL
  },

  setMultiversxAddress(multiversxAddress: string) {
    state.multiversxAddress = multiversxAddress
  },

  setTronAddress(tronAddress: string) {
    state.tronAddress = tronAddress
  },

  setTezosAddress(tezosAddress: string) {
    state.tezosAddress = tezosAddress
  },

  setKernelSmartAccountAddress(smartAccountAddress: string) {
    state.kernelSmartAccountAddress = smartAccountAddress
  },
  setSafeSmartAccountAddress(smartAccountAddress: string) {
    state.safeSmartAccountAddress = smartAccountAddress
  },
  setBiconomySmartAccountAddress(smartAccountAddress: string) {
    state.biconomySmartAccountAddress = smartAccountAddress
  },

  setActiveChainId(value: string) {
    state.activeChainId = value
  },

  setCurrentRequestVerifyContext(context: Verify.Context) {
    state.currentRequestVerifyContext = context
  },
  setSessions(sessions: SessionTypes.Struct[]) {
    state.sessions = sessions
  },

  toggleTestNets() {
    state.testNets = !state.testNets
    if (state.testNets) {
      state.smartAccountSponsorshipEnabled = true
      localStorage.setItem(TEST_NETS_ENABLED_KEY, 'YES')
    } else {
      state.smartAccountSponsorshipEnabled = false
      localStorage.removeItem(TEST_NETS_ENABLED_KEY)
    }
  },

  toggleSmartAccountSponsorship() {
    if (!state.testNets) return
    state.smartAccountSponsorshipEnabled = !state.smartAccountSponsorshipEnabled
  },

  toggleSmartAccountEnabled() {
    state.smartAccountEnabled = !state.smartAccountEnabled
    if (state.smartAccountEnabled) {
      localStorage.setItem(SMART_ACCOUNTS_ENABLED_KEY, 'YES')
    } else {
      localStorage.removeItem(SMART_ACCOUNTS_ENABLED_KEY)
    }
  },

  async toggleKernelSmartAccountsEnabled() {
    state.kernelSmartAccountEnabled = !state.kernelSmartAccountEnabled
    if (state.kernelSmartAccountEnabled) {
      const { eip155Addresses, eip155Wallets } = createOrRestoreEIP155Wallet()
      const { kernelSmartAccountAddress } = await createOrRestoreKernelSmartAccount(
        eip155Wallets[eip155Addresses[0]].getPrivateKey()
      )
      SettingsStore.setKernelSmartAccountAddress(kernelSmartAccountAddress)
      localStorage.setItem(ZERO_DEV_SMART_ACCOUNTS_ENABLED_KEY, 'YES')
    } else {
      removeSmartAccount(SettingsStore.state.kernelSmartAccountAddress)
      SettingsStore.setKernelSmartAccountAddress('')
      localStorage.removeItem(ZERO_DEV_SMART_ACCOUNTS_ENABLED_KEY)
    }
  },

  async toggleSafeSmartAccountsEnabled() {
    state.safeSmartAccountEnabled = !state.safeSmartAccountEnabled
    if (state.safeSmartAccountEnabled) {
      const { eip155Addresses, eip155Wallets } = createOrRestoreEIP155Wallet()
      const { safeSmartAccountAddress } = await createOrRestoreSafeSmartAccount(
        eip155Wallets[eip155Addresses[0]].getPrivateKey()
      )
      SettingsStore.setSafeSmartAccountAddress(safeSmartAccountAddress)
      localStorage.setItem(SAFE_SMART_ACCOUNTS_ENABLED_KEY, 'YES')
    } else {
      removeSmartAccount(SettingsStore.state.safeSmartAccountAddress)
      SettingsStore.setSafeSmartAccountAddress('')
      localStorage.removeItem(SAFE_SMART_ACCOUNTS_ENABLED_KEY)
    }
  },

  async toggleBiconomySmartAccountsEnabled() {
    state.biconomySmartAccountEnabled = !state.biconomySmartAccountEnabled
    if (state.biconomySmartAccountEnabled) {
      const { eip155Addresses, eip155Wallets } = createOrRestoreEIP155Wallet()
      const { biconomySmartAccountAddress } = await createOrRestoreBiconomySmartAccount(
        eip155Wallets[eip155Addresses[0]].getPrivateKey()
      )
      SettingsStore.setBiconomySmartAccountAddress(biconomySmartAccountAddress)
      localStorage.setItem(BICONOMY_SMART_ACCOUNTS_ENABLED_KEY, 'YES')
    } else {
      removeSmartAccount(SettingsStore.state.biconomySmartAccountAddress)
      SettingsStore.setBiconomySmartAccountAddress('')
      localStorage.removeItem(BICONOMY_SMART_ACCOUNTS_ENABLED_KEY)
    }
  }
}

export default SettingsStore
