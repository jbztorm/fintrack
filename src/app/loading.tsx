import Link from 'next/link';

export default function Loading() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            <span className="text-emerald-500">◆</span> FinTrack
          </Link>
          <div className="text-sm text-neutral-500">跨境支付情报看板</div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        <aside className="w-56 shrink-0 space-y-6">
          <div>
            <h3 className="text-xs font-medium text-neutral-500 uppercase mb-3">公司</h3>
            <div className="space-y-1 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-7 bg-neutral-800 rounded"></div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-medium text-neutral-500 uppercase mb-3">标签</h3>
            <div className="space-y-1 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-7 bg-neutral-800 rounded"></div>
              ))}
            </div>
          </div>
        </aside>
        <main className="flex-1 space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              加载中...
            </h2>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 w-16 bg-neutral-800 rounded"></div>
                    <div className="h-4 w-20 bg-neutral-800 rounded"></div>
                  </div>
                  <div className="h-5 bg-neutral-800 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-neutral-800 rounded w-full"></div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
