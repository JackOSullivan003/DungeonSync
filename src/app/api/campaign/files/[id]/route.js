import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET a single file by ID
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const collection = await getCollection('Files');

    const file = await collection.findOne({
      _id: new ObjectId(id),
    });

    if (!file) {
      return Response.json({ error: 'File not found' }, { status: 404 });
    }

    return Response.json(file);
  } catch (err) {
    console.error('GET file error:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH (update) a file
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const collection = await getCollection('Files');

    const updatePayload = {
      ...(body.title && { title: body.title }),
      ...(body.content && { content: body.content }),
      ...(body.folderId && { folderId: new ObjectId(body.folderId) }),
      updatedAt: Date.now(),
    };

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatePayload }
    );

    const updated = await collection.findOne({ _id: new ObjectId(id) });
    return Response.json(updated);
  } catch (err) {
    console.error('PATCH file error:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE a file
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const collection = await getCollection('Files');

    await collection.deleteOne({ _id: new ObjectId(id) });
    return Response.json({ deleted: true });
  } catch (err) {
    console.error('DELETE file error:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
