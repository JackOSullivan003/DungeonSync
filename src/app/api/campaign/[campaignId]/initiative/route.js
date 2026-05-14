import { getCollection } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import Ably from 'ably'
import crypto from 'crypto'

const defaultInitiative = {
  round: 1,
  activeIndex: 0,
  combatants: [],
}

function getAblyServer() {
  return new Ably.Rest(process.env.ABLY_API_KEY)
}

function sanitizeCombatants(combatants) {
  if (!Array.isArray(combatants)) return []

  return combatants.slice(0, 100).map((combatant, index) => ({
    id: String(combatant.id || crypto.randomUUID()),
    name: String(combatant.name || '').trim().slice(0, 80) || `Combatant ${index + 1}`,
    initiative: Number(combatant.initiative) || 0,
    hp: Number(combatant.hp) || 0,
    maxHp: Number(combatant.maxHp) || 0,
    ac: Number(combatant.ac) || 0,
    notes: String(combatant.notes || '').slice(0, 300),
  }))
}

function normalizeInitiative(body) {
  const combatants = sanitizeCombatants(body.combatants)
  const round = Math.max(1, Number(body.round) || 1)
  const activeIndex = combatants.length
    ? Math.max(0, Math.min(Number(body.activeIndex) || 0, combatants.length - 1))
    : 0

  return {
    round,
    activeIndex,
    combatants,
    updatedAt: new Date(),
  }
}

async function getCampaignForUser(campaignId, userId) {
  const campaignObjectId = new ObjectId(campaignId)
  const userObjectId = new ObjectId(userId)
  const campaigns = await getCollection('Campaigns')

  const campaign = await campaigns.findOne({
    _id: campaignObjectId,
    $or: [{ dmId: userObjectId }, { players: userObjectId }],
  })

  return { campaigns, campaign, campaignObjectId, userObjectId }
}

export async function GET(req, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { campaignId } = await params
    if (!ObjectId.isValid(campaignId))
      return NextResponse.json({ error: 'Invalid campaign' }, { status: 400 })

    const { campaign } = await getCampaignForUser(campaignId, user._id)
    if (!campaign) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    return NextResponse.json(campaign.initiative || defaultInitiative)
  } catch (err) {
    console.error('GET initiative error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { campaignId } = await params
    if (!ObjectId.isValid(campaignId))
      return NextResponse.json({ error: 'Invalid campaign' }, { status: 400 })

    const { campaigns, campaign, campaignObjectId, userObjectId } = await getCampaignForUser(campaignId, user._id)
    if (!campaign) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!campaign.dmId?.equals(userObjectId))
      return NextResponse.json({ error: 'Only the DM can update initiative' }, { status: 403 })

    const body = await req.json()
    const initiative = normalizeInitiative(body)

    await campaigns.updateOne(
      { _id: campaignObjectId },
      {
        $set: {
          initiative,
          updatedAt: new Date(),
        },
      }
    )

    try {
      const ably = getAblyServer()
      const channel = ably.channels.get(`campaign:${campaignId}:initiative`)
      await channel.publish('update', initiative)
    } catch (err) {
      console.error('Ably initiative publish error:', err)
    }

    return NextResponse.json(initiative)
  } catch (err) {
    console.error('PATCH initiative error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
