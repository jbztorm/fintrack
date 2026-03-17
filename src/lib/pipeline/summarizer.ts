import { callLLM } from '../api/llm';

interface SummaryResult {
  summary: string;
  type: 'llm' | 'extractive' | 'none';
}

export async function generateSummary(input: {
  title: string;
  content?: string;
  meta: { description?: string; ogDescription?: string };
  impactScore?: number;
}): Promise<SummaryResult> {
  // 1. Try LLM (only if configured and score >= 7)
  if (process.env.OPENAI_API_KEY && input.impactScore && input.impactScore >= 7) {
    try {
      const textToSummarize = `${input.title} ${input.content?.slice(0, 2000) || ''}`;
      const summary = await callLLM(`生成50字新闻摘要：${textToSummarize}`);
      if (summary) {
        return { summary: summary.slice(0, 150), type: 'llm' };
      }
    } catch (error) {
      console.error('LLM summary failed:', error);
    }
  }
  
  // 2. Fallback: extractive
  const extractive = input.meta.ogDescription 
    || input.meta.description 
    || input.content?.slice(0, 150) 
    || input.title;
  
  if (extractive) {
    return {
      summary: extractive.slice(0, 150),
      type: 'extractive',
    };
  }
  
  return {
    summary: '',
    type: 'none',
  };
}
