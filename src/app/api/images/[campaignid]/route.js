import { getCollection } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'

// POST uploads a new image and stores it as base64 in the Images collection
export async function POST(req, context) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { campaignid } = await context.params
    if (!ObjectId.isValid(campaignid))
      return NextResponse.json({ error: 'Invalid campaign id' }, { status: 400 })

    const campaigns = await getCollection('Campaigns')
    const campaign = await campaigns.findOne({ _id: new ObjectId(campaignid) })
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

    // check user is in the campaign
    const userId = new ObjectId(user._id)
    const isMember = campaign.dmId.equals(userId) || campaign.players?.some(p => p.equals(userId))
    if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { data, mimeType, type } = body

    // validate mime type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(mimeType))
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 })

    // validate base64 size — base64 is ~133% of original, 10MB limit
    const sizeInBytes = Buffer.byteLength(data, 'base64')
    if (sizeInBytes > 10 * 1024 * 1024)
      return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 400 })

    const images = await getCollection('Images')

    const doc = {
      campaignId: new ObjectId(campaignid),
      type: type || 'file_image', // 'campaign_background' | 'file_image'
      data,
      mimeType,
      uploadedBy: userId,
      uploadedAt: new Date(),
    }

    const result = await images.insertOne(doc)
    return NextResponse.json({ _id: result.insertedId.toString() })
  } catch (err) {
    console.error('POST image error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}