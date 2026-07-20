import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, BedDouble, CalendarRange, Users, Settings, Image, 
  Utensils, CreditCard, Baby, ListOrdered, AlarmClock as CalendarLock, 
  MessageSquare as MessageSquareStar, BarChart3, LogOut, Gift
} from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';

const ADMIN_NAV_LINKS = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Bookings', path: '/admin/bookings', icon: CalendarRange },
  { name: 'Rooms', path: '/admin/rooms', icon: BedDouble },
  { name: 'Room Allotments', path: '/admin/room-allotments', icon: ListOrdered },
  { name: 'Room Availability', path: '/admin/room-availability', icon: CalendarLock },
  { name: 'Pricing', path: '/admin/prices', icon: CreditCard },
  { name: 'Children Surcharges', path: '/admin/children-surcharges', icon: Baby },
  { name: 'Seasons', path: '/admin/seasons', icon: Settings },
  { name: 'Dining', path: '/admin/dining', icon: Utensils },
  { name: 'Gallery', path: '/admin/gallery', icon: Image },
  { name: 'Deals', path: '/admin/deals', icon: Gift },
  { name: 'Guests', path: '/admin/guests', icon: Users },
  { name: 'Guest Reviews', path: '/admin/reviews', icon: MessageSquareStar },
  { name: 'Reviews Analytics', path: '/admin/reviews-analytics', icon: BarChart3 },
];

export function AdminLayout({ children }) {
  const location = useLocation();
  const { adminUser, adminLogout } = useAdminAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0 z-10 shadow-sm">
        <div className="p-6">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-lg">
              H
            </div>
            <span className="font-serif font-bold text-xl tracking-tight text-foreground">Admin Portal</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto scrollbar-thin">
          {ADMIN_NAV_LINKS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Profile Section */}
        <div className="p-4 border-t border-border mt-auto bg-muted/30">
          <div className="flex flex-col mb-4 px-2">
            <span className="text-sm font-semibold text-foreground truncate">{adminUser?.name || 'Administrator'}</span>
            <span className="text-xs text-muted-foreground truncate">{adminUser?.email}</span>
          </div>
          <button 
            onClick={adminLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-muted/20">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}