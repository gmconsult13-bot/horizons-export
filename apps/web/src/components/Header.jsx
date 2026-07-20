import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGuestAuth } from '@/contexts/GuestAuthContext.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Rooms', path: '/rooms' },
  { name: 'Dining', path: '/dining' },
  { name: 'Gallery', path: '/gallery' },
  { name: 'Deals', path: '/deals' },
  { name: 'Contact', path: '/contact' },
];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { isGuestAuthenticated, currentGuest, logout: guestLogout } = useGuestAuth();
  const { isAuthenticated: isAdminAuthenticated, isAdmin, logout: adminLogout } = useAuth();

  const handleGuestLogout = () => {
    guestLogout();
    navigate('/');
  };

  const handleAdminLogout = () => {
    adminLogout();
    navigate('/');
  };

  const guestDisplayName = currentGuest?.name || currentGuest?.email?.split('@')[0] || 'Profile';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-primary font-serif">Raya Boutique</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === link.path ? 'text-primary font-semibold' : 'text-foreground/80'
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            <div className="h-6 w-px bg-border mx-2"></div>

            {/* Authentication States */}
            {!isGuestAuthenticated && !isAdminAuthenticated && (
              <>
                <Link to="/login" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Login</Link>
                <Link to="/register" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Register</Link>
              </>
            )}

            {isGuestAuthenticated && (
              <>
                <Link to="/profile" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors capitalize">
                  {guestDisplayName}
                </Link>
                <button onClick={handleGuestLogout} className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Logout</button>
              </>
            )}

            {isAdminAuthenticated && isAdmin && (
              <>
                <Link to="/admin" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Dashboard</Link>
                <button onClick={handleAdminLogout} className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Logout</button>
              </>
            )}

            {/* Phone Contact - Desktop (Prominent + Blinking) */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a 
                    href="tel:+359884443484"
                    className="phone-prominent animate-blink px-4 py-2"
                    aria-label="Call for fast booking"
                  >
                    <Phone className="h-5 w-5" />
                    <span className="hidden lg:inline tracking-wide">+359 884 443 484</span>
                  </a>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-destructive text-destructive-foreground font-medium border-none shadow-lg">
                  Call for fast booking
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 ml-2 rounded-none uppercase tracking-widest text-xs">
              <Link to="/booking">Book Now</Link>
            </Button>
          </nav>

          {/* Mobile Nav */}
          <div className="md:hidden flex items-center gap-3">
            {/* Phone Contact - Mobile Top Bar (Prominent + Blinking) */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a 
                    href="tel:+359884443484"
                    className="phone-prominent animate-blink px-3 py-2"
                    aria-label="Call for fast booking"
                  >
                    <Phone className="h-5 w-5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-destructive text-destructive-foreground font-medium border-none shadow-lg">
                  Call for fast booking
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] overflow-y-auto">
                <nav className="flex flex-col gap-6 mt-12">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`text-lg font-medium transition-colors hover:text-primary ${
                        location.pathname === link.path ? 'text-primary font-semibold' : 'text-foreground/80'
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}
                  
                  <div className="h-px w-full bg-border my-2"></div>

                  {!isGuestAuthenticated && !isAdminAuthenticated && (
                    <>
                      <Link to="/login" className="text-lg font-medium text-foreground/80 hover:text-primary transition-colors">Login</Link>
                      <Link to="/register" className="text-lg font-medium text-foreground/80 hover:text-primary transition-colors">Register</Link>
                    </>
                  )}

                  {isGuestAuthenticated && (
                    <>
                      <Link to="/profile" className="text-lg font-medium text-foreground/80 hover:text-primary transition-colors capitalize">{guestDisplayName}</Link>
                      <button onClick={handleGuestLogout} className="text-lg font-medium text-left text-foreground/80 hover:text-primary transition-colors">Logout</button>
                    </>
                  )}

                  {isAdminAuthenticated && isAdmin && (
                    <>
                      <Link to="/admin" className="text-lg font-medium text-foreground/80 hover:text-primary transition-colors">Dashboard</Link>
                      <button onClick={handleAdminLogout} className="text-lg font-medium text-left text-foreground/80 hover:text-primary transition-colors">Logout</button>
                    </>
                  )}

                  <div className="h-px w-full bg-border my-2"></div>

                  {/* Phone Contact - Mobile Menu (Prominent + Blinking) */}
                  <a 
                    href="tel:+359884443484"
                    className="phone-prominent animate-blink px-4 py-3 w-full"
                  >
                    <Phone className="h-5 w-5" />
                    <span>+359 884 443 484</span>
                  </a>

                  <Button asChild className="w-full mt-2 bg-primary text-primary-foreground">
                    <Link to="/booking">Book Now</Link>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}