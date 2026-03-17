import { db } from '@/lib/db';
import { newsItems, ingestionLogs } from '@/lib/db/schema';
import { lt } from 'drizzle-orm';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const newsResult = await db.delete(newsItems).where(lt(newsItems.publishedAt, sixtyDaysAgo)).returning({ id: newsItems.id });
    
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const logsResult = await db.delete(ingestionLogs).where(lt(ingestionLogs.startedAt, ninetyDaysAgo)).returning({ id: ingestionLogs.id });
    
    return Response.json({ success: true, deleted: { news: newsResult.length, logs: logsResult.length } });
  } catch (error) {
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
