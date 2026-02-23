import { getCollection } from '@/lib/mongodb' // MongoDB Helper File
import { getCurrentUser } from '@/lib/auth' // auth Helper File
import { ObjectId } from 'mongodb' // MongoDB ObjectId type
import { NextResponse } from 'next/server' // Next.js helper to send API responses

// GET is used to fetch a single campaign and check if the user is part of it
export async function GET(req, context) {
  try {
    const user = await getCurrentUser() // get the current logged-in user
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) // block if not logged in
    }

    const params = await context.params
    const id = params.campaignid // get campaign id from route

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid campaign id' },
        { status: 400 }
      ) // reject bad id format
    }

    const collection = await getCollection('Campaigns') // access Campaigns collection

    const campaign = await collection.findOne({
      _id: new ObjectId(id),
    }) // find campaign by id

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      ) // return if campaign does not exist
    }

    const userId = new ObjectId(user._id)

    const isDM = campaign.dmId?.equals(userId) // check if user is the DM
    const isPlayer = campaign.players?.some(p => p.equals(userId)) // check if user is a player

    if (!isDM && !isPlayer) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      ) // block if user not part of campaign
    }

    return NextResponse.json(campaign) // return campaign data (only hit if user is part of campaign)
  } catch (err) {
    console.error('GET campaign error:', err) // log server error
    return NextResponse.json( //return error note if any error is thrown
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

// PATCH is used to update, delete, or leave a campaign depending on the action in the request
export async function PATCH(req, context) {
  try {
    const user = await getCurrentUser() // get logged-in user
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) //toss error if no user detected
    }

    const params = await context.params
    const id = params.campaignid // get campaign id from route

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid campaign id' }, //toss error if campaign id is invalid
        { status: 400 }
      )
    }

    const body = await req.json() // read request body
    const collection = await getCollection('Campaigns')

    const campaign = await collection.findOne({
      _id: new ObjectId(id),
    }) // find campaign

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' }, //toss error if no campaign object found
        { status: 404 }
      )
    }

    const userId = new ObjectId(user._id)
    const isDM = campaign.dmId?.equals(userId) //check if user is the DM of the campaign
    const isPlayer = campaign.players?.some(p => p.equals(userId)) //check if user is in list of players in campaign

    // DELETE CAMPAIGN (DM ONLY)
    if (body.action === 'delete') {
      if (!isDM) {
        return NextResponse.json(
          { error: 'Only the DM can delete this campaign' },
          { status: 403 }
        )
      }

      await collection.deleteOne({ _id: new ObjectId(id) }) // remove campaign from database
      return NextResponse.json({ success: true })
    }

    // LEAVE CAMPAIGN (PLAYER ONLY)
    if (body.action === 'leave') {
      if (!isPlayer) {
        return NextResponse.json(
          { error: 'You are not a player in this campaign' }, // if user who made request is not a player in the campaign they requested to leave, return error
          { status: 400 }
        )
      }

      await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $pull: { players: userId }, // remove player from campaign list
          $set: { updatedAt: new Date() },
        }
      )

      return NextResponse.json({ success: true })
    }

    // UPDATE CAMPAIGN (DM ONLY)
    if (!isDM) {
      return NextResponse.json(
        { error: 'Only the DM can edit this campaign' }, //self explanatory, only DMs can edit campaign info
        { status: 403 }
      )
    }

    const updates = {} // object to store allowed updates

    if (typeof body.title === 'string' && body.title.trim()) {
      updates.title = body.title.trim() // update title if valid
    }

    if (typeof body.description === 'string') {
      updates.description = body.description // update description if valid
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      ) // stop if nothing to update
    }

    updates.updatedAt = new Date()

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates }, // apply updates
      { returnDocument: 'after' }
    )

    const updatedCampaign =
      {
        ...campaign,
        _id: campaign._id.toString(),
        dmId: campaign.dmId?.toString(),
        players: campaign.players?.map(p => p.toString()) ?? [],
      } // convert ObjectIds to strings for response

    return NextResponse.json(updatedCampaign)
  } catch (err) {
    console.error('PATCH campaign error:', err)
    return NextResponse.json(
      { error: 'Server error' }, //if error is tossed, return error
      { status: 500 }
    )
  }
}