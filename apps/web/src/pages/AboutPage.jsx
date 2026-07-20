import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
export default function AboutPage() {
  return <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Our Story | Raya Boutique</title>
        <meta name="description" content="Learn about the history, mission, and dedicated team behind Raya Boutique Hotel." />
      </Helmet>

      <Header />

      <main className="flex-grow">
        <section className="py-24 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold text-foreground mb-8 font-serif">Our Story</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Founded on the principles of holistic wellness and modern luxury, Raya Boutique emerged from a vision to create a true sanctuary in the bustling city. Our spaces weave together natural botanicals, warm lighting, and impeccable design to offer guests an escape from the ordinary.
            </p>
          </div>
        </section>

        <section className="py-24 bg-accent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-xl">
              <img src="https://horizons-cdn.hostinger.com/9719a614-3994-48cd-ad44-20d7d067e3db/883307370-XKC4K.jpg" alt="Hotel details" className="w-full h-full object-cover" />
            </div>
            <div className="text-accent-foreground">
              <h2 className="text-3xl font-bold mb-6 font-serif">Our Mission</h2>
              <p className="text-lg opacity-80 leading-relaxed mb-6">Our mission is to provide a comfortable, stylish and welcoming stay in the heart of Sunny Beach, offering exceptional service, modern amenities and a warm atmosphere that makes every guest feel at home.</p>
              <p className="text-lg opacity-80 leading-relaxed">
                We are committed to sustainable practices, partnering with local artisans and producers to ensure our footprint is as light as the peace we aim to inspire in our guests.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>;
}