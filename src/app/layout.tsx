import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FinTrack - 跨境支付公司情报追踪',
  description: '高密度、可筛选、可研究的情报看板',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" className="dark">
      <body className="min-h-screen bg-neutral-950 text-neutral-200 font-mono antialiased">
        {children}
      </body>
    </html>
  );
}
