import useSmartAccount from '@/hooks/useSmartAccount'
import { Hex } from 'viem'
import ChainAddressMini from './ChainAddressMini'
import { createOrRestoreEIP155Wallet, eip155Wallets } from '@/utils/EIP155WalletUtil'
import { Spinner } from '@nextui-org/react'

interface Props {
  namespace: string
}

const getKey = (namespace?: string) => {
  switch (namespace) {
    case 'eip155':
      createOrRestoreEIP155Wallet()
      console.log('eip155Wallets', eip155Wallets)
      const key = Object.values(eip155Wallets)[0]?.getPrivateKey() as Hex
      console.log('key', key)
      return key
  }
}

export default function ChainSmartAddressMini({ namespace }: Props) {
  const { address } = useSmartAccount(getKey(namespace) as `0x${string}`)

  if (!address) return <Spinner />
  return (
      <ChainAddressMini address={address}/>
  )
}