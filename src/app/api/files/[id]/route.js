import { getCollection } from '@/lib/mongodb' // MongoDB Helper File
import { ObjectId } from 'mongodb' // MongoDB ObjectId type
import { NextResponse } from 'next/server' // Next.js helper to send API responses
import { getCurrentUser } from '@/lib/auth'
import { UpdateFileSchema } from '@/lib/validation/FileSchemas'


// GET is used to fetch a single file by its id
export async function GET(req, { params }) {
  try {
    const user = await getCurrentUser() // ensure user logged in
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const collection = await getCollection('Files')

    const file = await collection.findOne({ _id: new ObjectId(id) })
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 }) // return if file does not exist
    }

    return NextResponse.json(file) // return file data
  } catch (err) {
    console.error('GET file error:', err) // log server error
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


// PATCH is used to update a file’s editable fields
export async function PATCH(req, context) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const params = await context.params
    const { id } = params // get file id from route

    if (!id) return NextResponse.json({ error: 'Missing file id' }, { status: 400 })

    const updates = await req.json() // read request body

    // remove protected fields
    const { _id, version, updatedAt, ...fieldsToUpdate } = updates

    // normalize parentId
    if ('parentId' in fieldsToUpdate && (fieldsToUpdate.parentId === '' || fieldsToUpdate.parentId === undefined))
      fieldsToUpdate.parentId = null

    // validate with schema.partial() so only sent fields are validated
    const parsed = UpdateFileSchema.partial().safeParse(fieldsToUpdate)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid update", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const collection = await getCollection('Files')

    const existing = await collection.findOne({ _id: new ObjectId(id) })
    if (!existing) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    // Handle visibleTo — GM only
    if ('visibleTo' in fieldsToUpdate) {
      const campaigns = await getCollection('Campaigns')
      const campaign = await campaigns.findOne({ _id: existing.campaignId })
      if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      
      const isDM = campaign.dmId.equals(new ObjectId(user._id))
      if (!isDM) return NextResponse.json({ error: 'Only the DM can change file permissions' }, { status: 403 })
      
      // visibleTo must be 'all' or an array of strings
      const vt = fieldsToUpdate.visibleTo
      if (vt !== 'all' && !Array.isArray(vt)) {
        return NextResponse.json({ error: 'Invalid visibleTo value' }, { status: 400 })
      }
    }

    const updated = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: { ...parsed.data, updatedAt: new Date() }, // update fields and timestamp
        $inc: { version: 1 }
      },
      { returnDocument: 'after' }
    )

    return NextResponse.json(updated) // return updated file
  } catch (err) {
    console.error('PATCH file error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


// DELETE is used to remove a file and all its child files recursively
export async function DELETE(req, context) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const params = await context.params
    const { id } = params
    const collection = await getCollection('Files')

    async function deleteRecursive(nodeId) {
      const children = await collection
        .find({ parentId: new ObjectId(nodeId) })  // find child files
        .toArray()

      for (const child of children) {
        await deleteRecursive(child._id)  // delete children first
      }

      await collection.deleteOne({ _id: new ObjectId(nodeId) })  // delete this file
    }

    await deleteRecursive(id) // start delete from root file

    return NextResponse.json({ deleted: true })
  } catch (err) {
    console.error('DELETE file error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}