'use client'

import { ABI, ContractAddress } from '@/config'
import { useEffect, useState } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'

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

  if (!isConnected) return <div></div>
  return (
    <>
      <span>Use Read contract on SEP ETH</span>

      <input
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value)
        }}
        name="id"
        placeholder="2"
        required
      />

      <span>data : {readData ? readData : 'no data for this id'}</span>

      <span>Use Write contract SEP ETH</span>
      <input
        value={name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setName(e.target.value)
        }}
        name="Name"
        placeholder="wallet connect app"
        required
      />
      <input
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value)
        }}
        name="value"
        placeholder="3"
        required
      />
      <button onClick={() => callWriteFunction()}> Use Write Function</button>
      {hash && <div>Transaction Hash: {hash}</div>}
    </>
  )
}
