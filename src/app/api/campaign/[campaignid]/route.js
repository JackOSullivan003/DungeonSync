import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'

export async function GET(req, context) {
  try {
    const params = await context.params

    //console.log(params)

    const id = params.campaignid

    if (!id || !ObjectId.isValid(id)) {
      console.error('Invalid campaign id:', id)
      return NextResponse.json(
        { error: 'Invalid campaign id' },
        { status: 400 }
      )
    }

    const collection = await getCollection('Campaigns')

    const campaign = await collection.findOne({
      _id: new ObjectId(id),
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(campaign)
  } catch (err) {
    console.error('GET campaign error:', err)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(req, context) {
  try {
    const params = await context.params

    const id = params.campaignid

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid campaign id' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { title } = body

    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'Invalid title' },
        { status: 400 }
      )
    }

    const collection = await getCollection('Campaigns')

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          title: title.trim(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    return NextResponse.json({
        _id: campaign._id,
        title: campaign.title,
        description: campaign.description,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt, 
    })
  } catch (err) {
    console.error('PATCH campaign error:', err)
    return NextResponse.json(
      { error: 'Server error: ', err },
      { status: 500 }
    )
  }
}
