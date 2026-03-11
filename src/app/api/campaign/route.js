import { getCollection } from '@/lib/mongodb' // MongoDB Helper File
import { getCurrentUser } from '@/lib/auth' // auth Helper File
import { ObjectId } from 'mongodb' // MongoDB ObjectId type
import { NextResponse } from 'next/server' // Next.js helper to send API responses

// GET is used to fetch all campaigns where the user is the DM or a player
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const campaignsCollection = await getCollection('Campaigns')
  const usersCollection = await getCollection('Users')
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

  // Collect unique GM ids and fetch their usernames in one query
  const gmIds = [...new Set(campaigns.map(c => c.dmId.toString()))]
  const gmUsers = await usersCollection
    .find({ _id: { $in: gmIds.map(id => new ObjectId(id)) } })
    .project({ _id: 1, username: 1 })
    .toArray()

  const gmUsernameMap = Object.fromEntries(gmUsers.map(u => [u._id.toString(), u.username]))

  const enriched = campaigns.map(c => ({
    ...c,
    gmUsername: gmUsernameMap[c.dmId.toString()] ?? 'Unknown'
  }))

  return NextResponse.json(enriched)
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
    title: body.title || 'New Campaign',
    description: body.description || '',
    iconName: body.iconName || null,
    cardColor: body.cardColor || null,
    dmId: new ObjectId(user._id),
    players: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const result = await campaignsCollection.insertOne(campaign) // save new campaign

  return NextResponse.json({
    _id: result.insertedId,
    ...campaign
  }) // return created campaign info
}