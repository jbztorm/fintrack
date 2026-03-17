'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 在生产环境中记录错误到控制台
    console.error('Page error:', error);
  }, [error]);

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
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 max-w-md mx-auto">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h2 className="text-xl font-semibold mb-2">页面加载失败</h2>
          <p className="text-neutral-400 mb-4">
            抱歉，页面在渲染时发生了错误
          </p>
          {process.env.NODE_ENV === 'development' && error.message && (
            <p className="text-xs text-neutral-500 bg-neutral-800 p-2 rounded mb-4 font-mono">
              {error.message}
            </p>
          )}
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    </div>
  );
}
