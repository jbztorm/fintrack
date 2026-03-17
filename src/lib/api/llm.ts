import OpenAI from 'openai';

let openai: OpenAI | null = null;

function getOpenAI() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export async function callLLM(prompt: string): Promise<string> {
  const client = getOpenAI();
  
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { 
        role: 'system', 
        content: '你是一个新闻摘要助手。请用50字以内简洁概括新闻要点。' 
      },
      { role: 'user', content: prompt }
    ],
    max_tokens: 100,
    temperature: 0.3,
  });
  
  return response.choices[0]?.message?.content || '';
}
