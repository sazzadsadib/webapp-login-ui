'use client';
import React, { useState } from 'react';
import AuthCard from '../components/AuthCard';

export default function DemoPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 bg-gradient-to-tr from-[#E0F2FE] via-[#F0F7FF] to-[#F8FAFC] overflow-hidden">
      
      {/* Background Soft Glow Ambient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-sky-200/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-200/30 blur-[140px] pointer-events-none" />

      {/* Floating Centered Auth Card */}
      <div className="z-10 w-full flex items-center justify-center">
        <AuthCard 
          title="Sign in with email"
          subtitle="Make a new doc to bring your words, data, and teams together. For free"
          onSuccess={(user) => setCurrentUser(user)}
        />
      </div>

    </main>
  );
}
