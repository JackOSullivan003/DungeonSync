import { getCollection } from '@/lib/mongodb' // MongoDB Helper File
import { getCurrentUser } from '@/lib/auth' // auth Helper File
import { ObjectId } from 'mongodb' // MongoDB ObjectId type
import { NextResponse } from 'next/server' // Next.js helper to send API responses


// GET is used to fetch and return all files for a campaign the user has access to
export async function GET(req, { params }) {
  const user = await getCurrentUser() // check who is making the request
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) // block if not logged in
  }

  const { campaignid } = await params // get campaign id from the route

  console.log( "Get campaginid: ", campaignid) // log for debugging

  if (!ObjectId.isValid(campaignid)) {
    return NextResponse.json({ error: "Invalid campaign" }, { status: 400 }) // reject bad id format
  }

  const campaigns = await getCollection("Campaigns") // access Campaigns collection

  const campaign = await campaigns.findOne({
    _id: new ObjectId(campaignid),
    $or: [
      { dmId: new ObjectId(user._id) }, // allow if user is the DM
      { players: new ObjectId(user._id) } // allow if user is a player
    ]
  })

  if (!campaign) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 }) // block if user not part of campaign
  }

  const files = await getCollection("Files") // access Files collection

  const result = await files
    .find({ campaignId: new ObjectId(campaignid) }) // find files linked to this campaign
    .sort({ updatedAt: 1 }) // sort by last updated time
    .toArray()

  console.log(result) // log files for debugging
  return NextResponse.json(result ?? []) // return files or empty array
}


// POST is used to create a new file inside a campaign the user has access to
export async function POST(req, context) {
  const user = await getCurrentUser() // check logged-in user
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) // block if not logged in
  }

  const params = await context.params
  const { campaignid } = params // get campaign id from route

  console.log("Post campaignid:", campaignid)
  const body = await req.json() // read request body
  const { title, parentId, nodeType } = body // get file info from body

  if (!ObjectId.isValid(campaignid)) {
    return NextResponse.json({ error: "Invalid campaign" }, { status: 400 }) // reject bad id
  }

  const campaigns = await getCollection("Campaigns") // access Campaigns collection

  const campaign = await campaigns.findOne({
    _id: new ObjectId(campaignid),
    $or: [
      { dmId: new ObjectId(user._id) }, // allow if DM
      { players: new ObjectId(user._id) } // allow if player
    ]
  })

  if (!campaign) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 }) // block if not in campaign
  }

  const files = await getCollection("Files") // access Files collection

  const doc = {
    campaignId: new ObjectId(campaignid), // link file to campaign
    title: title || "Untitled", // default title if none given
    parentId: parentId ? new ObjectId(parentId) : null, // optional parent folder
    nodeType,
    fileType: "markdown", // default file type
    content: "", // start with empty content
    updatedAt: new Date(), // track last update time
    version: 1,
  }

  const result = await files.insertOne(doc) // save new file to database

  return NextResponse.json({ _id: result.insertedId, ...doc }) // return created file info
}