import React from 'react';
import { Helmet } from 'react-helmet';
import { MapPin, Phone, Mail } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Contact Us | Raya Boutique</title>
        <meta name="description" content="Get in touch with Raya Boutique for inquiries and support." />
      </Helmet>

      <Header />

      <main className="flex-grow py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Contact Info */}
            <div>
              <h1 className="text-5xl font-bold text-foreground mb-8">Get in Touch</h1>
              <p className="text-lg text-muted-foreground mb-12">
                Whether you have a question about our rooms, need assistance with your booking, or want to arrange a special request, our team is here to help.
              </p>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Location</h3>
                    <p className="text-muted-foreground">82 Kamelia, 8240 Sunny Beach, Bulgaria</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Phone</h3>
                    <p className="text-muted-foreground">+359884443484<br />+359888066612</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Email</h3>
                    <p className="text-muted-foreground">info@rayaboutique.eu</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hostinger Reach Contact Form */}
            <div className="bg-card p-8 md:p-12 rounded-2xl shadow-lg border border-border">
              <h2 className="text-2xl font-semibold mb-8">Send a Message</h2>
              <div data-reach-form="76c6439d-a263-4a99-9f79-518ee251d546"></div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}