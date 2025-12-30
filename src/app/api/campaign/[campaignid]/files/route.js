import { getCollection } from '@/lib/mongodb'

export async function GET(req, { params }) {
  const { campaignId } = await params
  const filesCollection = await getCollection('Files')
  const files = await filesCollection.find({ campaign_id: campaignId }).toArray()
  return new Response(JSON.stringify(files), { status: 200 })
}

export async function POST(req, { params }) {
  const { campaignId } = params
  const body = await req.json()

  const newNode = {
    campaign_id: campaignId,
    title: body.title,
    parentId: body.parentId || null,
    nodeType: body.nodeType,
    fileType: body.fileType || 'markdown',
    content: '',
    updatedAt: Date.now(),
  }

  const filesCollection = await getCollection('Files')
  const result = await filesCollection.insertOne(newNode)
  return new Response(JSON.stringify({ ...newNode, _id: result.insertedId }), { status: 200 })
}
