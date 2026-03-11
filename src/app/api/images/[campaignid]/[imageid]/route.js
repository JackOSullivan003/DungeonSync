import { getCollection } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'

// GET serves image data — validates user is a member of the campaign
export async function GET(req, context) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { campaignid, imageid } = await context.params

    if (!ObjectId.isValid(campaignid) || !ObjectId.isValid(imageid))
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const campaigns = await getCollection('Campaigns')
    const campaign = await campaigns.findOne({ _id: new ObjectId(campaignid) })
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

    // check user is in the campaign
    const userId = new ObjectId(user._id)
    const isMember = campaign.dmId.equals(userId) || campaign.players?.some(p => p.equals(userId))
    if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const images = await getCollection('Images')
    const image = await images.findOne({
      _id: new ObjectId(imageid),
      campaignId: new ObjectId(campaignid), // ensure image belongs to this campaign
    })

    if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 })

    return NextResponse.json({
      _id: image._id.toString(),
      data: image.data,
      mimeType: image.mimeType,
      type: image.type,
    })
  } catch (err) {
    console.error('GET image error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE removes an image — uploader or GM only
export async function DELETE(req, context) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { campaignid, imageid } = await context.params

    if (!ObjectId.isValid(campaignid) || !ObjectId.isValid(imageid))
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const campaigns = await getCollection('Campaigns')
    const campaign = await campaigns.findOne({ _id: new ObjectId(campaignid) })
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

    const userId = new ObjectId(user._id)
    const isGM = campaign.dmId.equals(userId)

    const images = await getCollection('Images')
    const image = await images.findOne({
      _id: new ObjectId(imageid),
      campaignId: new ObjectId(campaignid),
    })

    if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 })

    // allow delete if user is GM or the uploader
    const isUploader = image.uploadedBy.equals(userId)
    if (!isGM && !isUploader)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await images.deleteOne({ _id: new ObjectId(imageid) })
    return NextResponse.json({ deleted: true })
  } catch (err) {
    console.error('DELETE image error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}