import React from 'react';

export const metadata = {
  title: '꽃새담 여의도 예약현황',
  description: '예약현황',
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