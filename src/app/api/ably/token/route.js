import { getCurrentUser } from '@/lib/auth'
import { NextResponse } from 'next/server'
import Ably from 'ably'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = new Ably.Rest(process.env.ABLY_API_KEY)
  const tokenRequest = await client.auth.createTokenRequest({
    clientId: user._id.toString(),
  })

  return NextResponse.json(tokenRequest)
}