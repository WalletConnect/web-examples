import { useEffect, useState } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { ABI, ContractAddress } from './configs'

export default function Contracts() {
  const { isConnected } = useAccount()
  const { data: hash, writeContract } = useWriteContract()
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [readData, setData] = useState('')

  async function callWriteFunction() {
    writeContract({
      address: ContractAddress,
      abi: ABI,
      functionName: 'createData',
      args: [name, value],
    })
  }
  
  const data = useReadContract({
    address: ContractAddress,
    abi: ABI,
    functionName: 'readData',
    args: [value],
  })

  useEffect(() => {
    setData(data?.data as string)
  }, [data])

  if (!isConnected) return null

  return (
    <>
      <br />
      <span>Use Read contract on SEP ETH</span>
      <br />
      Id:{' '}
      <input
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value)
        }}
        name="id"
        placeholder="2"
        required
      />
      <br />
      <span>data : {readData ? readData : 'no data for this id'}</span>
      <br />
      <br />
      <span>Use Write contract SEP ETH</span>
      <br />
      Name:{' '}
      <input
        value={name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setName(e.target.value)
        }}
        name="Name"
        placeholder="wallet connect app"
        required
      />
      <br />
      Value:{' '}
      <input
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value)
        }}
        name="value"
        placeholder="3"
        required
      />
      <br />
      <button onClick={() => callWriteFunction()}> Use Write Function</button>
      <br />
      {hash && <div>Transaction Hash: {hash}</div>}
    </>
  )
}
