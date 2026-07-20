import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowLeft, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils.js';

export function AdminHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        isScrolled 
          ? "bg-background/95 backdrop-blur-md border-border shadow-sm py-3" 
          : "bg-transparent border-transparent py-5"
      )}
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
              <span className="font-serif text-2xl font-bold text-primary-foreground leading-none">H</span>
            </div>
            <span className="font-serif font-bold text-2xl tracking-tight text-foreground hidden sm:block">
              Hotel Admin
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Website
            </Link>
            
            <div className="h-6 w-px bg-border mx-2" />
            
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
              <Link to="/admin/login">
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Link>
            </Button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      <div 
        className={cn(
          "md:hidden absolute top-full left-0 right-0 bg-card border-b border-border shadow-xl transition-all duration-300 overflow-hidden",
          mobileMenuOpen ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="p-4 flex flex-col gap-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground p-2 hover:bg-muted rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Main Website
          </Link>
          <Button asChild className="w-full bg-primary text-primary-foreground">
            <Link to="/admin/login">
              <LogIn className="w-4 h-4 mr-2" />
              Login to Admin Area
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}