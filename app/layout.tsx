import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '예약현황',
  description: '매장 실시간 예약 관리 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}