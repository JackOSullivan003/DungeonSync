import { getCollection } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { code } = await req.json()
    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 })

    const collection = await getCollection('Campaigns')
    const campaign = await collection.findOne({
      inviteCode: code.trim().toUpperCase(),
      inviteCodeExpiry: { $gt: new Date() } // must not be expired
    })

    if (!campaign) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 404 })

    const userId = new ObjectId(user._id)
    const isDM = campaign.dmId?.equals(userId)
    const isPlayer = campaign.players?.some(p => p.equals(userId))

    if (isDM || isPlayer)
      return NextResponse.json({ error: 'You are already in this campaign' }, { status: 400 })

    await collection.updateOne(
      { _id: campaign._id },
      {
        $push: { players: userId },
        $set: { updatedAt: new Date() }
      }
    )

    // Return the campaign in the same shape the dashboard expects
    const joined = {
      ...campaign,
      _id: campaign._id.toString(),
      dmId: campaign.dmId?.toString(),
      players: [...(campaign.players ?? []).map(p => p.toString()), userId.toString()],
    }

    return NextResponse.json(joined)
  } catch (err) {
    console.error('POST join error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}