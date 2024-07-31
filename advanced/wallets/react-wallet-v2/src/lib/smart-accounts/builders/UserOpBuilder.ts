import { UserOperation } from 'permissionless'
import { Address, Hex } from 'viem'

type Call = { to: Address; value: bigint; data: Hex }

type UserOp = UserOperation<'v0.7'>

export type FillUserOpParams = {
  chainId: number
  account: Address
  calls: Call[]
  capabilities: {
    paymasterService?: { url: string }
    permissions?: { context: Hex }
  }
}
export type FillUserOpResponse = {
  userOp: UserOp
  hash: Hex
}
export type SendUserOpWithSigantureParams = {
  chainId: Hex
  userOp: UserOp
  signature: Hex
  permissionsContext?: Hex
}
export type SendUserOpWithSigantureResponse = {
  receipt: Hex
}

export interface UserOpBuilder {
  fillUserOp(params: FillUserOpParams): Promise<FillUserOpResponse>
  sendUserOpWithSignature(
    params: SendUserOpWithSigantureParams
  ): Promise<SendUserOpWithSigantureResponse>
}
