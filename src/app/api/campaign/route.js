import { getCollection } from '@/lib/mongodb'
import { NextResponse } from 'next/server'

export async function GET() {
  const campaignsCollection = await getCollection('Campaigns')

  const campaigns = await campaignsCollection
    .find({})
    .sort({ createdAt: -1 })
    .toArray()

  return NextResponse.json(campaigns)
}

export async function POST(req) {
  const body = await req.json()
  const campaignsCollection = await getCollection('Campaigns')

  const campaign = {
    title: body.title || 'New Campaign',
    description: body.description || '',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const result = await campaignsCollection.insertOne(campaign)

  return NextResponse.json({
    _id: result.insertedId,
    ...campaign
  })
}
