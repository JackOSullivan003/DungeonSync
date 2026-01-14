import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req, context) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const id = params.campaignid

    if (!id || !ObjectId.isValid(id)) {
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

    const userId = new ObjectId(user._id)

    const isDM = campaign.dmId?.equals(userId)
    const isPlayer = campaign.players?.some(p => p.equals(userId))

    if (!isDM && !isPlayer) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
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
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const id = params.campaignid

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid campaign id' },
        { status: 400 }
      )
    }

    const body = await req.json()
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

    const userId = new ObjectId(user._id)
    const isDM = campaign.dmId?.equals(userId)
    const isPlayer = campaign.players?.some(p => p.equals(userId))

    // DELETE CAMPAIGN (DM ONLY)
    if (body.action === 'delete') {
      if (!isDM) {
        return NextResponse.json(
          { error: 'Only the DM can delete this campaign' },
          { status: 403 }
        )
      }

      await collection.deleteOne({ _id: new ObjectId(id) })
      return NextResponse.json({ success: true })
    }

    // LEAVE CAMPAIGN (PLAYER ONLY)
    if (body.action === 'leave') {
      if (!isPlayer) {
        return NextResponse.json(
          { error: 'You are not a player in this campaign' },
          { status: 400 }
        )
      }

      await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $pull: { players: userId },
          $set: { updatedAt: new Date() },
        }
      )

      return NextResponse.json({ success: true })
    }

    // UPDATE CAMPAIGN (DM ONLY)
    if (!isDM) {
      return NextResponse.json(
        { error: 'Only the DM can edit this campaign' },
        { status: 403 }
      )
    }

    const updates = {}

    if (typeof body.title === 'string' && body.title.trim()) {
      updates.title = body.title.trim()
    }

    if (typeof body.description === 'string') {
      updates.description = body.description
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    updates.updatedAt = new Date()

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: 'after' }
    )

    const updatedCampaign =
      {
        ...campaign,
        _id: campaign._id.toString(),
        dmId: campaign.dmId?.toString(),
        players: campaign.players?.map(p => p.toString()) ?? [],
      }

    return NextResponse.json(updatedCampaign)
  } catch (err) {
    console.error('PATCH campaign error:', err)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
