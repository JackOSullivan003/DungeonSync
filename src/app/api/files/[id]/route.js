import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'

export async function GET(req, { params }) {
  try {
    const { id } = await params
    const collection = await getCollection('Files')

    const file = await collection.findOne({ _id: new ObjectId(id) })
    if (!file) {
      return new Response(JSON.stringify({ error: 'File not found' }), { status: 404 })
    }

    return new Response(JSON.stringify(file), { status: 200 })
  } catch (err) {
    console.error('GET file error:', err)
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}


export async function PATCH(req, context) {
  try {
    // Next.js requires awaiting params
    const params = await context.params
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Missing file id' }, { status: 400 })
    }

    // Parse request body
    const updates = await req.json()

    // Only allow mutable fields
    const { _id, version, lastKnownUpdatedAt, ...fieldsToUpdate } = updates

    const collection = await getCollection('Files')

    // Debug: check the ID
    // console.log('PATCH id:', id)
    // console.log('Type of id:', typeof id)
    // console.log('All file IDs in DB:', (await collection.find({}).project({ _id: 1 }).toArray()).map(f => f._id.toString()))

    // Verify the document exists
    const existing = await collection.findOne({ _id: new ObjectId(id) })
    if (!existing) {
      console.log('No file found with this id in DB:', id)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Perform update
    const updated = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: { ...fieldsToUpdate, updatedAt: Date.now() },
        $inc: { version: 1 } // make sure 'version' field exists in DB or remove this if not needed
      },
      { returnDocument: 'after' }
    )

    return NextResponse.json(updated || { ...fieldsToUpdate, _id: id })
  } catch (err) {
    console.error('PATCH file error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


export async function DELETE(req, { params }) {
  try {
    const { id } = await params
    const collection = await getCollection('Files')

    async function deleteRecursive(nodeId) {
      const children = await collection
        .find({ parentId: new ObjectId(nodeId) })
        .toArray()

      for (const child of children) {
        await deleteRecursive(child._id)
      }

      await collection.deleteOne({ _id: new ObjectId(nodeId) })
    }

    await deleteRecursive(id)

    return new Response(JSON.stringify({ deleted: true }), { status: 200 })
  } catch (err) {
    console.error('DELETE file error:', err)
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}
