import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const collection = await getCollection('Folders');
    const folders = await collection.find({}).toArray();
    return Response.json(folders);
  } catch (err) {
    console.error('GET folders error:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const title = body.title?.trim() || 'Untitled';

    const collection = await getCollection('Folders');
    const newFolder = {
      title,
      parentId: body.parentId || null, // optional nesting
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const result = await collection.insertOne(newFolder);
    return Response.json({ ...newFolder, _id: result.insertedId });
  } catch (err) {
    console.error('POST folder error:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
