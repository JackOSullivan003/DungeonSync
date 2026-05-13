import { getCollection } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'

// GET - return all members of a campaign (GM + players) with avatar data
export async function GET(req, { params }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { campaignId } = await params
  if (!ObjectId.isValid(campaignId))
    return NextResponse.json({ error: 'Invalid campaign' }, { status: 400 })

  const campaignObjectId = new ObjectId(campaignId)
  const userObjectId = new ObjectId(user._id)

  const campaigns = await getCollection('Campaigns')
  const campaign = await campaigns.findOne({
    _id: campaignObjectId,
    $or: [{ dmId: userObjectId }, { players: userObjectId }],
  })
  if (!campaign) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Collect all member IDs: GM first, then players
  const allIds = [
    campaign.dmId,
    ...(campaign.players ?? []),
  ].filter(Boolean)

  const users = await getCollection('Users')
  const userDocs = await users.find({
    _id: { $in: allIds },
  }).toArray()

  const userMap = Object.fromEntries(userDocs.map(u => [u._id.toString(), u]))

  const members = allIds.map(id => {
    const idStr = id.toString()
    const u = userMap[idStr]
    if (!u) return null
    return {
      userId: idStr,
      username: u.username || u.name || 'Unknown',
      avatar: u.avatar ?? null,
      avatarMimeType: u.avatarMimeType ?? null,
      isGM: campaign.dmId?.equals(id),
    }
  }).filter(Boolean)

  return NextResponse.json(members)
}