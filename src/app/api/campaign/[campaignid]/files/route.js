import { getCollection } from '@/lib/mongodb' // MongoDB Helper File
import { getCurrentUser } from '@/lib/auth' // auth Helper File
import { ObjectId } from 'mongodb' // MongoDB ObjectId type
import { NextResponse } from 'next/server' // Next.js helper to send API responses
import { CreateFileSchema } from '@/lib/validation/FileSchemas' // Zod validation schema


// GET is used to fetch and return all files for a campaign the user has access to
export async function GET(req, { params }) {
  const user = await getCurrentUser() // check who is making the request
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) // block if not logged in
  }

  const { campaignid } = await params // get campaign id from the route

  if (!ObjectId.isValid(campaignid)) {
    return NextResponse.json({ error: "Invalid campaign" }, { status: 400 }) // reject bad id format
  }

  const campaignObjectId = new ObjectId(campaignid)
  const userObjectId = new ObjectId(user._id)
  const campaigns = await getCollection("Campaigns") // access Campaigns collection

  const campaign = await campaigns.findOne({
    _id: campaignObjectId,
    $or: [
      { dmId: userObjectId }, // allow if user is the DM
      { players: userObjectId } // allow if user is a player
    ]
  })

  if (!campaign) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 }) // block if user not part of campaign
  }

  const files = await getCollection("Files") // access Files collection

  const result = await files
    .find({ campaignId: campaignObjectId }) // find files linked to this campaign
    .sort({ updatedAt: 1 }) // sort by last updated time
    .toArray()

  return NextResponse.json(result ?? []) // return files or empty array
}


// POST is used to create a new file inside a campaign the user has access to
export async function POST(req, context) {
  const user = await getCurrentUser() // check logged-in user
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) // block if not logged in
  }

  const { campaignid } = await context.params // get campaign id from route

  if (!ObjectId.isValid(campaignid)) {
    return NextResponse.json({ error: "Invalid campaign" }, { status: 400 }) // reject bad id
  }

  // read body from request
  const body = await req.json()

  // normalize parentId (undefined, null, or empty string -> null)
  if (!body.parentId) body.parentId = null

  // validate file using FileSchema
  const parsed = CreateFileSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // destructure validated data
  const { title, parentId, nodeType, fileType } = parsed.data

  const campaignObjectId = new ObjectId(campaignid)
  const userObjectId = new ObjectId(user._id)

  const campaigns = await getCollection("Campaigns") // access Campaigns collection

  // verify user has access to campaign
  const campaign = await campaigns.findOne({
    _id: campaignObjectId,
    $or: [
      { dmId: userObjectId }, // allow if DM
      { players: userObjectId } // allow if player
    ]
  })

  if (!campaign) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 }) // block if not in campaign
  }

  const files = await getCollection("Files")

  // verify parent belongs to campaign (if provided)
  let parentObjectId = null
  if (parentId) {
    parentObjectId = new ObjectId(parentId)

    const parentFile = await files.findOne({
      _id: parentObjectId,
      campaignId: campaignObjectId
    })

    if (!parentFile) {
      return NextResponse.json(
        { error: "Parent file not found in this campaign" },
        { status: 400 }
      )
    }

    // folders can only contain children if parent is folder
    if (parentFile.nodeType !== "folder") {
      return NextResponse.json(
        { error: "Parent must be a folder" },
        { status: 400 }
      )
    }
  }

  // construct new file document
  const doc = {
    campaignId: campaignObjectId,  // link file to campaign
    title: title || "Untitled", // default title if none given
    parentId: parentObjectId, // optional parent folder
    nodeType: nodeType || "file", // sidebar rendering
    fileType: "markdown", // default file type
    content: "", // start with empty content
    updatedAt: new Date(), // track last update time
    version: 1,
  }

  const result = await files.insertOne(doc)

  return NextResponse.json({ _id: result.insertedId, ...doc })
}
