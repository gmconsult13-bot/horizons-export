import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Mail, Phone, LogOut, CheckCircle2, AlertCircle, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useGuestAuth } from '@/contexts/GuestAuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import pb from '@/lib/pocketbaseClient.js';

export default function GuestAccountPage() {
  const { currentGuest, logout } = useGuestAuth();
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('You have been logged out.');
    navigate('/');
  };

  const handleResendConfirmation = async () => {
    setIsResending(true);
    try {
      await pb.collection('guests').requestVerification(currentGuest.email, { $autoCancel: false });
      toast.success('Verification email sent!', {
        description: 'Please check your inbox.'
      });
    } catch (error) {
      console.error('Failed to resend:', error);
      toast.error('Failed to send verification email.', {
        description: 'Please try again later or contact support.'
      });
    } finally {
      setIsResending(false);
    }
  };

  if (!currentGuest) return null; // Caught by ProtectedGuestRoute

  const isVerified = currentGuest.emailVerified || currentGuest.verified === true;
  const guestDisplayName = currentGuest.email?.split('@')[0] || 'Guest User';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>My Account | Raya Boutique</title>
      </Helmet>
      <Header />

      <main className="flex-grow py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="mb-10">
            <h1 className="text-3xl font-bold font-serif text-foreground">My Account</h1>
            <p className="text-muted-foreground mt-2">Manage your personal details and bookings.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Sidebar / Quick Actions */}
            <div className="col-span-1 space-y-4">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <User className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-lg text-foreground capitalize">{guestDisplayName}</h3>
                <p className="text-sm text-muted-foreground mb-6">Guest Member</p>
                
                <Button 
                  variant="outline" 
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-border"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="col-span-1 md:col-span-2 space-y-6">
              
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  Profile Information
                </h2>
                
                <div className="space-y-6">
                  {/* Email Section */}
                  <div className="flex items-start justify-between border-b border-border pb-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 bg-muted p-2 rounded-lg text-muted-foreground">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Email Address</p>
                        <p className="text-foreground font-medium">{currentGuest.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                          {isVerified ? (
                            <span className="inline-flex items-center text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                            </span>
                          ) : (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                              <span className="inline-flex items-center text-xs font-medium text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full">
                                <AlertCircle className="w-3 h-3 mr-1" /> Unverified
                              </span>
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="h-auto p-0 text-xs text-primary"
                                onClick={handleResendConfirmation}
                                disabled={isResending}
                              >
                                {isResending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                                Resend verification link
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phone Section */}
                  <div className="flex items-start gap-4 pb-2">
                    <div className="mt-1 bg-muted p-2 rounded-lg text-muted-foreground">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Phone Number</p>
                      <p className="text-foreground font-medium">{currentGuest.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}