import { getCollection } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req, context) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { campaignid } = await context.params
    if (!campaignid || !ObjectId.isValid(campaignid))
      return NextResponse.json({ error: 'Invalid campaign id' }, { status: 400 })

    const collection = await getCollection('Campaigns')
    const campaign = await collection.findOne({ _id: new ObjectId(campaignid) })

    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

    const isDM = campaign.dmId?.equals(new ObjectId(user._id))
    if (!isDM) return NextResponse.json({ error: 'Only the DM can generate invite codes' }, { status: 403 })

    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase() // e.g. "A3F9B2C1"
    const inviteCodeExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    await collection.updateOne(
      { _id: new ObjectId(campaignid) },
      { $set: { inviteCode, inviteCodeExpiry } }
    )

    return NextResponse.json({ inviteCode, inviteCodeExpiry })
  } catch (err) {
    console.error('POST invite error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}