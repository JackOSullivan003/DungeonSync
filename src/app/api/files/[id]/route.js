import { getCollection } from '@/lib/mongodb' // MongoDB Helper File
import { ObjectId } from 'mongodb' // MongoDB ObjectId type
import { NextResponse } from 'next/server' // Next.js helper to send API responses


// GET is used to fetch a single file by its id
export async function GET(req, { params }) {
  try {
    const { id } = await params // get file id from route
    const collection = await getCollection('Files') // access Files collection

    const file = await collection.findOne({ _id: new ObjectId(id) }) // find file in database
    if (!file) {
      return new Response(JSON.stringify({ error: 'File not found' }), { status: 404 }) // return if file does not exist
    }

    return new Response(JSON.stringify(file), { status: 200 }) // return file data
  } catch (err) {
    console.error('GET file error:', err) // log server error
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}


// PATCH is used to update a file’s editable fields
export async function PATCH(req, context) {
  try {
    // Next.js requires awaiting params
    const params = await context.params
    const { id } = params // get file id from route

    if (!id) {
      return NextResponse.json({ error: 'Missing file id' }, { status: 400 }) // stop if id missing
    }

    // Parse request body
    const updates = await req.json() // read request body

    // Only allow mutable fields
    const { _id, version, lastKnownUpdatedAt, ...fieldsToUpdate } = updates // remove protected fields

    const collection = await getCollection('Files') // access Files collection

    // Verify the document exists
    const existing = await collection.findOne({ _id: new ObjectId(id) }) // check file exists
    if (!existing) {
      console.log('No file found with this id in DB:', id)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Perform update
    const updated = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: { ...fieldsToUpdate, updatedAt: Date.now() }, // update fields and timestamp
        $inc: { version: 1 } // increase version number
      },
      { returnDocument: 'after' }
    )

    return NextResponse.json(updated || { ...fieldsToUpdate, _id: id }) // return updated file
  } catch (err) {
    console.error('PATCH file error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


// DELETE is used to remove a file and all its child files recursively
export async function DELETE(req, context) {
  try {
    const params = await context.params
    const { id } = params // get file id from route
    const collection = await getCollection('Files') // access Files collection

    async function deleteRecursive(nodeId) {
      const children = await collection
        .find({ parentId: new ObjectId(nodeId) }) // find child files
        .toArray()

      for (const child of children) {
        await deleteRecursive(child._id) // delete children first
      }

      await collection.deleteOne({ _id: new ObjectId(nodeId) }) // delete this file
    }

    await deleteRecursive(id) // start delete from root file

    return new Response(JSON.stringify({ deleted: true }), { status: 200 }) // confirm deletion
  } catch (err) {
    console.error('DELETE file error:', err)
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}