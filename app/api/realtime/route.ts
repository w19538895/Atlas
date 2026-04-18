import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST() {
  const session = await openai.beta.realtime.sessions.create({
    model: 'gpt-4o-realtime-preview-2024-12-17',
    voice: 'shimmer',
    instructions: 'You are Atlas, an enthusiastic and friendly AI travel guide. Help users discover landmarks, find local recommendations, and answer travel questions. Keep responses conversational and under 3 sentences. Always end with a question to keep conversation going.',
    turn_detection: { type: 'server_vad' },
  })
  return NextResponse.json(session)
}
