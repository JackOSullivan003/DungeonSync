import { getCollection } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { parseDiceExpression } from '@/lib/DiceParser'
import Ably from 'ably'

function getAblyServer() {
  return new Ably.Rest(process.env.ABLY_API_KEY)
}

// GET — fetch last 50 messages, with avatar data joined from Users
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

  const messages = await getCollection('Messages')
  const result = await messages
    .find({ campaignId: campaignObjectId })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray()

  // Join avatar data from Users for non-system messages
  const users = await getCollection('Users')
  const userIds = [...new Set(
    result
      .filter(m => m.userId)
      .map(m => m.userId.toString())
  )]

  const userDocs = userIds.length > 0
    ? await users.find({
        _id: { $in: userIds.map(id => new ObjectId(id)) }
      }).toArray()
    : []

  const userMap = Object.fromEntries(
    userDocs.map(u => [u._id.toString(), { avatar: u.avatar ?? null, avatarMimeType: u.avatarMimeType ?? null }])
  )

  const enriched = result.map(m => ({
    ...m,
    _id: m._id.toString(),
    campaignId: m.campaignId.toString(),
    userId: m.userId?.toString() ?? null,
    ...(m.userId ? (userMap[m.userId.toString()] ?? {}) : {}),
  }))

  return NextResponse.json(enriched.reverse())
}

// POST — send a message or roll, publish to Ably
export async function POST(req, { params }) {
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

  const body = await req.json()
  const { content } = body

  if (!content?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 })
  if (content.length > 1000) return NextResponse.json({ error: 'Message too long' }, { status: 400 })

  const messages = await getCollection('Messages')
  const isDiceRoll = content.trim().startsWith('/')
  let doc

  if (isDiceRoll) {
    const rollData = parseDiceExpression(content.trim())
    doc = {
      campaignId: campaignObjectId,
      userId: userObjectId,
      username: user.username || user.name || 'Unknown',
      content: content.trim(),
      type: rollData ? 'roll' : 'message',
      ...(rollData ? { rollData } : {}),
      createdAt: new Date(),
    }
  } else {
    doc = {
      campaignId: campaignObjectId,
      userId: userObjectId,
      username: user.username || user.name || 'Unknown',
      content: content.trim(),
      type: 'message',
      createdAt: new Date(),
    }
  }

  const result = await messages.insertOne(doc)

  const payload = {
    ...doc,
    _id: result.insertedId.toString(),
    campaignId: campaignId,
    userId: userObjectId.toString(),
    avatar: user.avatar ?? null,
    avatarMimeType: user.avatarMimeType ?? null,
  }

  // Publish to Ably
  try {
    const ably = getAblyServer()
    const channel = ably.channels.get(`campaign:${campaignId}:chat`)
    await channel.publish('message', payload)
  } catch (err) {
    console.error('Ably publish error:', err)
  }

  return NextResponse.json(payload)
}