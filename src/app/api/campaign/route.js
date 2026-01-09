import { getCollection } from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const campaignsCollection = await getCollection('Campaigns')
  const userId = new ObjectId(user._id)

  const campaigns = await campaignsCollection
    .find({
      $or: [
        { dmId: userId },
        { players: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .toArray()

  return NextResponse.json(campaigns)
}

export async function POST(req) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const campaignsCollection = await getCollection('Campaigns')

  const campaign = {
    title: body.title || 'New Campaign',
    description: body.description || '',
    backgroundImage: body.backgroundImage || '',

    dmId: new ObjectId(user._id),
    players: [],

    createdAt: new Date(),
    updatedAt: new Date()
  }

  const result = await campaignsCollection.insertOne(campaign)

  return NextResponse.json({
    _id: result.insertedId,
    ...campaign
  })
}
