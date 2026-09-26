import React from 'react';

export const metadata = {
  title: '식당 예약 관리 대시보드',
  description: '점주 전용 예약 관리 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}