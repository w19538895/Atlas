import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_PROMPT = `You are Atlas, an enthusiastic and knowledgeable AI tour guide companion. Your purpose is to help travelers discover and learn about landmarks, attractions, and destinations worldwide. Be friendly, engaging, and informative. Share interesting facts and historical context. Always encourage users to ask questions by ending responses with prompts like 'Would you like to know more about this?' or 'What else would you like to explore?' Keep responses conversational and under 150 words unless the user asks for more detail.`;

export async function sendChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[]
): Promise<string> {
  try {
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 300,
    });

    const assistantMessage = response.choices[0]?.message?.content;
    
    if (!assistantMessage) {
      throw new Error('No response from OpenAI');
    }

    return assistantMessage;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new Error('Invalid API key. Please check your OpenAI API key.');
      } else if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.message.includes('500')) {
        throw new Error('OpenAI service is temporarily unavailable.');
      } else {
        throw new Error(`Chat error: ${error.message}`);
      }
    }
    
    throw new Error('Failed to get response from AI tour guide. Please try again.');
  }
}
