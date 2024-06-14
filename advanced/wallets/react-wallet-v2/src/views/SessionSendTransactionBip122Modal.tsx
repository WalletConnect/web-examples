import { useCallback, useState } from 'react'
import { Divider, Text } from '@nextui-org/react'

import RequestDataCard from '@/components/RequestDataCard'
import RequesDetailsCard from '@/components/RequestDetalilsCard'
import RequestMethodCard from '@/components/RequestMethodCard'
import ModalStore from '@/store/ModalStore'
import { approveEIP155Request, rejectEIP155Request } from '@/utils/EIP155RequestHandlerUtil'
import { styledToast } from '@/utils/HelperUtil'
import { web3wallet } from '@/utils/WalletConnectUtil'
import RequestModal from './RequestModal'
import { approveBip122Request, rejectBip122Request } from '@/utils/Bip122RequestHandlerUtil'

export default function SessionSendTransactionBip122Modal() {
  const [isLoadingApprove, setIsLoadingApprove] = useState(false)
  const [isLoadingReject, setIsLoadingReject] = useState(false)

  // Get request and wallet data from store
  const requestEvent = ModalStore.state.data?.requestEvent
  const requestSession = ModalStore.state.data?.requestSession

  const topic = requestEvent?.topic
  const params = requestEvent?.params
  const chainId = params?.chainId
  const request = params?.request
  const transaction = request?.params

  // Handle approve action
  const onApprove = useCallback(async () => {
    if (requestEvent && topic) {
      setIsLoadingApprove(true)
      try {
        const response = await approveBip122Request(requestEvent)
        await web3wallet.respondSessionRequest({
          topic,
          response
        })
      } catch (e) {
        setIsLoadingApprove(false)
        styledToast((e as Error).message, 'error')
        return
      }
      setIsLoadingApprove(false)
      ModalStore.close()
    }
  }, [requestEvent, topic])

  // Handle reject action
  const onReject = useCallback(async () => {
    if (requestEvent && topic) {
      setIsLoadingReject(true)
      const response = rejectBip122Request(requestEvent)
      try {
        await web3wallet.respondSessionRequest({
          topic,
          response
        })
      } catch (e) {
        setIsLoadingReject(false)
        styledToast((e as Error).message, 'error')
        return
      }
      setIsLoadingReject(false)
      ModalStore.close()
    }
  }, [requestEvent, topic])

  return request && requestSession ? (
    <RequestModal
      intention="sign a transaction"
      metadata={requestSession?.peer.metadata}
      onApprove={onApprove}
      onReject={onReject}
      approveLoader={{ active: isLoadingApprove }}
      rejectLoader={{ active: isLoadingReject }}
    >
      <RequestDataCard data={transaction} />
      <Divider y={1} />
      <RequesDetailsCard chains={[chainId ?? '']} protocol={requestSession?.relay.protocol} />
      <Divider y={1} />
      <RequestMethodCard methods={[request.method]} />
    </RequestModal>
  ) : (
    <Text>Request not found</Text>
  )
}
