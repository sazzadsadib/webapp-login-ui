import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Secure Auth Kit — Hardened Next.js Authentication Starter',
  description: 'Production-ready authentication component with Gmail canonicalization, disposable mail blocker, and OAuth 2.0 integrations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#F0F7FF] selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
