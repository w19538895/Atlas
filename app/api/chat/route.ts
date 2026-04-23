import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      );
    }

    // Build system message with critical plain text instruction
    const systemMessage = systemPrompt 
      ? `${systemPrompt}\n\nCRITICAL: Respond in plain sentences only. No markdown. No bullet points. No numbered lists. No bold. No headers. No special characters.`
      : 'You are a helpful assistant. Respond in plain sentences only. No markdown. No bullet points. No numbered lists. No bold. No headers. No special characters.'

    // Add system message to the beginning of messages array
    const messagesWithSystem = [
      { role: 'system', content: systemMessage },
      ...messages
    ]

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messagesWithSystem as any,
      temperature: 0.7,
      max_tokens: 50,
    });

    const message = response.choices[0]?.message?.content || '';

    return NextResponse.json({ message });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
