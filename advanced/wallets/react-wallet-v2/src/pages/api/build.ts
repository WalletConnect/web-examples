import { SafeUserOpBuilder } from '@/lib/smart-accounts/builders/SafeUserOpBuilder'
import { FillUserOpResponse } from '@/lib/smart-accounts/builders/UserOpBuilder'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FillUserOpResponse>
) {
  const builder = new SafeUserOpBuilder()
  const response = await builder.fillUserOp(req.body)
  res.status(200).json(response)
}
