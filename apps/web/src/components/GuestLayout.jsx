import React from 'react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

export default function GuestLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {children}
      </main>

      <Footer />
    </div>
  );
}