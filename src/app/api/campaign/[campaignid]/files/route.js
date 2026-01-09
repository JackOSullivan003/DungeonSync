import { getCollection } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'

export async function GET(req, { params }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { campaignid } = await params

  console.log( "Get campaginid: ", campaignid)

  if (!ObjectId.isValid(campaignid)) {
    return NextResponse.json({ error: "Invalid campaign" }, { status: 400 })
  }

  const campaigns = await getCollection("Campaigns")

  const campaign = await campaigns.findOne({
    _id: new ObjectId(campaignid),
    $or: [
      { dmId: new ObjectId(user._id) },
      { players: new ObjectId(user._id) }
    ]
  })

  if (!campaign) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const files = await getCollection("Files")

  const result = await files
    .find({ campaignId: new ObjectId(campaignid) })
    .sort({ updatedAt: 1 })
    .toArray()

  console.log(result)
  return NextResponse.json(result ?? [])
}


export async function POST(req, { params }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { campaignid } = await params

  console.log("Post campaignid:", campaignid)
  const body = await req.json()
  const { title, parentId, nodeType } = body

  if (!ObjectId.isValid(campaignid)) {
    return NextResponse.json({ error: "Invalid campaign" }, { status: 400 })
  }

  const campaigns = await getCollection("Campaigns")

  const campaign = await campaigns.findOne({
    _id: new ObjectId(campaignid),
    $or: [
      { dmId: new ObjectId(user._id) },
      { players: new ObjectId(user._id) }
    ]
  })

  if (!campaign) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const files = await getCollection("Files")

  const doc = {
    campaignId: new ObjectId(campaignid),
    title: title || "Untitled",
    parentId: parentId ? new ObjectId(parentId) : null,
    nodeType,
    fileType: "markdown",
    content: "",
    updatedAt: new Date(), 
    version: 1,
  }

  const result = await files.insertOne(doc)

  return NextResponse.json({ _id: result.insertedId, ...doc })
}
