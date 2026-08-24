import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WebApp Login UI — Supabase Login Components',
  description: 'Reusable login, signup, OAuth, and password recovery UI for React and Next.js.',
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
