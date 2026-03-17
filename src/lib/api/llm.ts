import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function callLLM(prompt: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  
  const response = await openai.chat.completions.create({
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
