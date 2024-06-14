import { SessionTypes, SignClientTypes } from '@walletconnect/types'
import { Web3WalletTypes } from '@walletconnect/web3wallet'
import { proxy } from 'valtio'

/**
 * Types
 */
interface ModalData {
  proposal?: SignClientTypes.EventArguments['session_proposal']
  requestEvent?: SignClientTypes.EventArguments['session_request']
  requestSession?: SessionTypes.Struct
  request?: Web3WalletTypes.AuthRequest
  loadingMessage?: string
  authRequest?: SignClientTypes.EventArguments['session_authenticate']
}

interface State {
  open: boolean
  view?:
    | 'SessionProposalModal'
    | 'SessionSignModal'
    | 'SessionSignTypedDataModal'
    | 'SessionSendTransactionModal'
    | 'SessionSendCallsModal'
    | 'SessionUnsuportedMethodModal'
    | 'SessionSignCosmosModal'
    | 'SessionSignSolanaModal'
    | 'SessionSignPolkadotModal'
    | 'SessionSignNearModal'
    | 'SessionSignMultiversxModal'
    | 'SessionSignTronModal'
    | 'SessionSignTezosModal'
    | 'SessionSignKadenaModal'
    | 'AuthRequestModal'
    | 'SessionAuthenticateModal'
    | 'LoadingModal'
    | 'SessionSignBip122Modal'
    | 'SessionSendTransactionBip122Modal'
  data?: ModalData
}

/**
 * State
 */
const state = proxy<State>({
  open: false
})

/**
 * Store / Actions
 */
const ModalStore = {
  state,

  open(view: State['view'], data: State['data']) {
    state.view = view
    state.data = data
    state.open = true
  },

  close() {
    state.open = false
  }
}

export default ModalStore
