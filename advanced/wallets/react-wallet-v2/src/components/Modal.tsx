import ModalStore from '@/store/ModalStore'
import SessionProposalModal from '@/views/SessionProposalModal'
import SessionSendTransactionModal from '@/views/SessionSendTransactionModal'
import SessionSignCosmosModal from '@/views/SessionSignCosmosModal'
import SessionRequestModal from '@/views/SessionSignModal'
import SessionSignNearModal from '@/views/SessionSignNearModal'
import SessionSignPolkadotModal from '@/views/SessionSignPolkadotModal'
import SessionSignSolanaModal from '@/views/SessionSignSolanaModal'
import SessionSignMultiversxModal from '@/views/SessionSignMultiversxModal'
import SessionSignTronModal from '@/views/SessionSignTronModal'
import SessionSignTezosModal from '@/views/SessionSignTezosModal'
import SessionSignKadenaModal from '@/views/SessionSignKadenaModal'
import SessionSignTypedDataModal from '@/views/SessionSignTypedDataModal'
import SessionUnsuportedMethodModal from '@/views/SessionUnsuportedMethodModal'
import SessionSendCallsModal from '@/views/SessionSendCallsModal'
import { Modal as NextModal } from '@nextui-org/react'
import { useSnapshot } from 'valtio'
import { useCallback, useMemo } from 'react'
import AuthRequestModal from '@/views/AuthRequestModal'
import LoadingModal from '@/views/LoadingModal'
import SessionAuthenticateModal from '@/views/SessionAuthenticateModal'
import SessionSignBip122Modal from '@/views/SessionSignBip122Modal'
import SessionSendTransactionBip122Modal from '@/views/SessionSendTransactionBip122Modal'

export default function Modal() {
  const { open, view } = useSnapshot(ModalStore.state)
  // handle the modal being closed by click outside
  const onClose = useCallback(() => {
    if (open) {
      ModalStore.close()
    }
  }, [open])

  const componentView = useMemo(() => {
    switch (view) {
      case 'SessionProposalModal':
        return <SessionProposalModal />
      case 'SessionSignModal':
        return <SessionRequestModal />
      case 'SessionSignTypedDataModal':
        return <SessionSignTypedDataModal />
      case 'SessionSendTransactionModal':
        return <SessionSendTransactionModal />
      case 'SessionSendCallsModal':
        return <SessionSendCallsModal />
      case 'SessionUnsuportedMethodModal':
        return <SessionUnsuportedMethodModal />
      case 'SessionSignCosmosModal':
        return <SessionSignCosmosModal />
      case 'SessionSignSolanaModal':
        return <SessionSignSolanaModal />
      case 'SessionSignPolkadotModal':
        return <SessionSignPolkadotModal />
      case 'SessionSignNearModal':
        return <SessionSignNearModal />
      case 'SessionSignMultiversxModal':
        return <SessionSignMultiversxModal />
      case 'SessionSignTronModal':
        return <SessionSignTronModal />
      case 'SessionSignTezosModal':
        return <SessionSignTezosModal />
      case 'SessionSignKadenaModal':
        return <SessionSignKadenaModal />
      case 'AuthRequestModal':
        return <AuthRequestModal />
      case 'LoadingModal':
        return <LoadingModal />
      case 'SessionAuthenticateModal':
        return <SessionAuthenticateModal />
      case 'SessionSignBip122Modal':
        return <SessionSignBip122Modal />
      case 'SessionSendTransactionBip122Modal':
        return <SessionSendTransactionBip122Modal />
      default:
        return null
    }
  }, [view])

  return (
    <NextModal
      blur
      onClose={onClose}
      open={open}
      style={{ border: '1px solid rgba(139, 139, 139, 0.4)' }}
    >
      {componentView}
    </NextModal>
  )
}
