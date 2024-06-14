/* eslint-disable react-hooks/rules-of-hooks */
import { Col, Divider, Row, Text } from '@nextui-org/react'

import RequestDataCard from '@/components/RequestDataCard'
import RequestDetailsCard from '@/components/RequestDetalilsCard'
import ModalStore from '@/store/ModalStore'
import { convertHexToUtf8, styledToast } from '@/utils/HelperUtil'
import { web3wallet } from '@/utils/WalletConnectUtil'
import RequestModal from './RequestModal'
import { useCallback, useState } from 'react'
import { approveBip122Request, rejectBip122Request } from '@/utils/Bip122RequestHandlerUtil'

export default function SessionSignBip122Modal() {
  // Get request and wallet data from store
  const requestEvent = ModalStore.state.data?.requestEvent
  const requestSession = ModalStore.state.data?.requestSession
  const [isLoadingApprove, setIsLoadingApprove] = useState(false)
  const [isLoadingReject, setIsLoadingReject] = useState(false)

  // Ensure request and wallet are defined
  if (!requestEvent || !requestSession) {
    return <Text>Missing request data</Text>
  }

  // Get required request data
  const { topic, params } = requestEvent
  const { request, chainId } = params
  const message = request.params[0]
  // Handle approve action (logic varies based on request method)
  const onApprove = useCallback(async () => {
    if (requestEvent) {
      // setIsLoadingApprove(true)
      const response = await approveBip122Request(requestEvent)
      console.log('response', response)
      try {
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
    if (requestEvent) {
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

  return (
    <RequestModal
      intention="sign a Kadena message"
      metadata={requestSession.peer.metadata}
      onApprove={onApprove}
      onReject={onReject}
      approveLoader={{ active: isLoadingApprove }}
      rejectLoader={{ active: isLoadingReject }}
    >
      <RequestDetailsCard chains={[chainId ?? '']} protocol={requestSession.relay.protocol} />
      <Divider y={1} />
      {message && (
        <>
          <Row>
            <Col>
              <Text h5>Message</Text>
              <Text color="$gray400">{message}</Text>
            </Col>
          </Row>
          <Divider y={1} />
        </>
      )}
      <RequestDataCard data={params} />
    </RequestModal>
  )
}
