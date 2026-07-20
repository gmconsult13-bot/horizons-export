import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <span className="text-2xl font-bold tracking-tight font-serif mb-4 block text-primary">Raya Boutique</span>
            <p className="text-secondary-foreground/80 max-w-sm mt-4 text-sm leading-relaxed">
              Experience unparalleled luxury and botanical serenity in the heart of the city. A sanctuary designed for the modern traveler.
            </p>
          </div>
          
          <div>
            <p className="font-semibold mb-4 tracking-wider uppercase text-sm text-secondary-foreground">Quick Links</p>
            <ul className="space-y-3 text-sm text-secondary-foreground/80">
              <li><Link to="/rooms" className="hover:text-primary transition-colors">Our Rooms</Link></li>
              <li><Link to="/dining" className="hover:text-primary transition-colors">Dining</Link></li>
              <li><Link to="/gallery" className="hover:text-primary transition-colors">Gallery</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link to="/booking" className="hover:text-primary transition-colors">Book Now</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-4 tracking-wider uppercase text-sm text-secondary-foreground">Connect</p>
            <div className="flex gap-4 mb-6">
              <a href="#" className="text-secondary-foreground/80 hover:text-primary transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-secondary-foreground/80 hover:text-primary transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-secondary-foreground/80 hover:text-primary transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
            <p className="text-sm text-secondary-foreground/80">82 Kamelia<br />8240 Sunny Beach, Bulgaria&nbsp;<br />info@rayaboutique.eu</p>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-secondary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-secondary-foreground/60">
          <p>© {new Date().getFullYear()} Raya Boutique. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link to="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-primary transition-colors">Terms of Service</Link>
            <span className="hidden md:inline text-secondary-foreground/20">•</span>
            <Link to="/admin-login" className="text-secondary-foreground/30 hover:text-secondary-foreground/60 transition-colors text-xs">Admin Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}