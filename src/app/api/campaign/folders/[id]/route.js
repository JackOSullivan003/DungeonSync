import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.title) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }

    const collection = await getCollection('Folders');

    const updated = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { title: body.title, updatedAt: Date.now() } },
      { returnDocument: 'after' }
    );

    if (!updated.value) {
      return Response.json({ error: 'Folder not found' }, { status: 404 });
    }

    return Response.json(updated.value);
  } catch (err) {
    console.error('PATCH folder error:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params; // string id
    const folderCollection = await getCollection('Folders');
    const fileCollection = await getCollection('Files');

    // Convert string to ObjectId
    const rootFolderId = new ObjectId(id);

    // Recursively delete folder and its contents
    async function deleteFolderRecursively(folderId) {
      // Find subfolders of this folder
      const subfolders = await folderCollection
        .find({ parentId: folderId.toString() }) // store parentId as string in DB
        .toArray();

      for (const sub of subfolders) {
        await deleteFolderRecursively(sub._id);
      }

      // Delete all files in this folder
      await fileCollection.deleteMany({ folderId });

      // Delete this folder itself
      await folderCollection.deleteOne({ _id: folderId });
    }

    await deleteFolderRecursively(rootFolderId);

    return Response.json({ deleted: true });
  } catch (err) {
    console.error('DELETE folder error:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

