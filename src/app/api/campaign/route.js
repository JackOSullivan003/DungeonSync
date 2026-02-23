import { getCollection } from '@/lib/mongodb' // MongoDB Helper File
import { getCurrentUser } from '@/lib/auth' // auth Helper File
import { ObjectId } from 'mongodb' // MongoDB ObjectId type
import { NextResponse } from 'next/server' // Next.js helper to send API responses

// GET is used to fetch all campaigns where the user is the DM or a player
export async function GET() {
  const user = await getCurrentUser() // check who is making the request
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) // block if not logged in
  }

  const campaignsCollection = await getCollection('Campaigns') // access Campaigns collection
  const userId = new ObjectId(user._id)

  const campaigns = await campaignsCollection
    .find({
      $or: [
        { dmId: userId }, // campaigns where user is the DM
        { players: userId } // campaigns where user is a player
      ]
    })
    .sort({ createdAt: -1 }) // newest campaigns first
    .toArray()

  return NextResponse.json(campaigns) // return campaign list
}

// POST is used to create a new campaign owned by the logged-in user
export async function POST(req) {
  const user = await getCurrentUser() // check logged-in user
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json() // read request body
  const campaignsCollection = await getCollection('Campaigns')

  const campaign = {
    title: body.title || 'New Campaign', // default title if none provided
    description: body.description || '', // default empty description
    backgroundImage: body.backgroundImage || '', // optional background image

    dmId: new ObjectId(user._id), // set creator as DM
    players: [], // start with no players

    createdAt: new Date(),
    updatedAt: new Date()
  }

  const result = await campaignsCollection.insertOne(campaign) // save new campaign

  return NextResponse.json({
    _id: result.insertedId,
    ...campaign
  }) // return created campaign info
}