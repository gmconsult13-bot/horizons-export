
import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import { GuestAuthProvider } from '@/contexts/GuestAuthContext.jsx';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext.jsx';
import { CartProvider } from '@/hooks/useCart.jsx';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute.jsx';
import ProtectedGuestRoute from '@/components/ProtectedGuestRoute.jsx';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import FacebookPixel from '@/components/FacebookPixel.jsx';

// Public Pages
import HomePage from '@/pages/HomePage.jsx';
import RoomsPage from '@/pages/RoomsPage.jsx';
import DiningPage from '@/pages/DiningPage.jsx';
import GalleryPage from '@/pages/GalleryPage.jsx';
import DealsPage from '@/pages/DealsPage.jsx';
import ContactPage from '@/pages/ContactPage.jsx';
import SeptemberOfferPage from '@/pages/SeptemberOfferPage.jsx';

// Guest Public/Auth Pages
import GuestLoginPage from '@/pages/GuestLoginPage.jsx';
import GuestRegistrationPage from '@/pages/GuestRegistrationPage.jsx';
import VerifyEmailPage from '@/pages/VerifyEmailPage.jsx';
import GuestForgotPasswordPage from '@/pages/GuestForgotPasswordPage.jsx';
import GuestResetPasswordPage from '@/pages/GuestResetPasswordPage.jsx';
import ReviewsPage from '@/pages/ReviewsPage.jsx';
import ReviewSubmitPage from '@/pages/ReviewSubmitPage.jsx';

// Protected Guest Pages
import BookingPage from '@/pages/BookingPage.jsx';
import BookingReviewPage from '@/pages/BookingReviewPage.jsx';
import CheckoutPage from '@/pages/CheckoutPage.jsx';
import BookingConfirmationPage from '@/pages/BookingConfirmationPage.jsx';
import GuestDashboard from '@/pages/GuestDashboard.jsx';
import GuestAccountPage from '@/pages/GuestAccountPage.jsx';
import GuestProfilePage from '@/pages/GuestProfilePage.jsx';
import PaymentPage from '@/pages/PaymentPage.jsx';
import SuccessPage from '@/pages/SuccessPage.jsx';
import CancelPage from '@/pages/CancelPage.jsx';

// Admin Auth & Pages
import AdminLandingPage from '@/pages/AdminLandingPage.jsx';
import AdminLoginPage from '@/pages/AdminLoginPage.jsx';
import AdminForgotPasswordPage from '@/pages/AdminForgotPasswordPage.jsx';
import AdminResetPasswordPage from '@/pages/AdminResetPasswordPage.jsx';
import AdminDashboard from '@/pages/admin/AdminDashboard.jsx';
import RoomManagement from '@/pages/admin/RoomManagement.jsx';
import SeasonManagement from '@/pages/admin/SeasonManagement.jsx';
import PriceManagement from '@/pages/admin/PriceManagement.jsx';
import ChildrenSurchargesManagement from '@/pages/admin/ChildrenSurchargesManagement.jsx';
import DiningManagement from '@/pages/admin/DiningManagement.jsx';
import GalleryManagement from '@/pages/admin/GalleryManagement.jsx';
import GuestDatabase from '@/pages/admin/GuestDatabase.jsx';
import BookingsManagement from '@/pages/admin/BookingsManagement.jsx';
import AdminBookingsPage from '@/pages/admin/AdminBookingsPage.jsx';
import AccommodationTypeManagement from '@/pages/admin/AccommodationTypeManagement.jsx';
import RoomAllotmentsPage from '@/pages/admin/RoomAllotmentsPage.jsx';
import RoomAvailabilityPage from '@/pages/admin/RoomAvailabilityPage.jsx';
import AdminReviewsPage from '@/pages/admin/AdminReviewsPage.jsx';
import ReviewsAnalyticsPage from '@/pages/admin/ReviewsAnalyticsPage.jsx';
import GuestDealsManagement from '@/pages/admin/GuestDealsManagement.jsx';
import OfferLeadsPage from '@/pages/admin/OfferLeadsPage.jsx';

import { Toaster } from '@/components/ui/sonner';

function App() {
  const isLandingPageHost =
    typeof window !== 'undefined' &&
    window.location.hostname.toLowerCase() === 'landingpage.rayaboutique.eu';

  return (
    <AuthProvider>
      <GuestAuthProvider>
        <AdminAuthProvider>
          <CartProvider>
            <Router>
              <ScrollToTop />
              <FacebookPixel />
              <Routes>
                {/* Public Pages */}
                <Route path="/" element={isLandingPageHost ? <SeptemberOfferPage /> : <HomePage />} />
                <Route path="/rooms" element={<RoomsPage />} />
                <Route path="/dining" element={<DiningPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/deals" element={<DealsPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/september-offer" element={<SeptemberOfferPage />} />
                <Route path="/offer" element={<SeptemberOfferPage />} />
                <Route path="/reviews" element={<ReviewsPage />} />
                <Route path="/reviews/submit" element={<ReviewSubmitPage />} />
                
                {/* Guest Authentication & Verification */}
                <Route path="/login" element={<GuestLoginPage />} />
                <Route path="/register" element={<GuestRegistrationPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/forgot-password" element={<GuestForgotPasswordPage />} />
                <Route path="/reset-password" element={<GuestResetPasswordPage />} />
                
                {/* Protected Guest Routes */}
                <Route path="/profile" element={<ProtectedGuestRoute><GuestProfilePage /></ProtectedGuestRoute>} />
                <Route path="/account" element={<ProtectedGuestRoute><GuestAccountPage /></ProtectedGuestRoute>} />
                <Route path="/booking" element={<ProtectedGuestRoute><BookingPage /></ProtectedGuestRoute>} />
                <Route path="/booking/review" element={<ProtectedGuestRoute><BookingReviewPage /></ProtectedGuestRoute>} />
                <Route path="/booking/checkout" element={<ProtectedGuestRoute><CheckoutPage /></ProtectedGuestRoute>} />
                <Route path="/booking/confirmation" element={<ProtectedGuestRoute><BookingConfirmationPage /></ProtectedGuestRoute>} />
                <Route path="/guest/bookings" element={<ProtectedGuestRoute><GuestDashboard /></ProtectedGuestRoute>} />
                
                {/* Legacy guest routes preserved */}
                <Route path="/payment" element={<ProtectedGuestRoute><PaymentPage /></ProtectedGuestRoute>} />
                <Route path="/success" element={<ProtectedGuestRoute><SuccessPage /></ProtectedGuestRoute>} />
                <Route path="/cancel" element={<ProtectedGuestRoute><CancelPage /></ProtectedGuestRoute>} />
                
                {/* Admin Auth */}
                <Route path="/admin-login" element={<AdminLoginPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
                <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />
                
                {/* Protected Admin Routes */}
                <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
                <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
                <Route path="/admin/rooms" element={<ProtectedAdminRoute><RoomManagement /></ProtectedAdminRoute>} />
                <Route path="/admin/room-allotments" element={<ProtectedAdminRoute><RoomAllotmentsPage /></ProtectedAdminRoute>} />
                <Route path="/admin/room-availability" element={<ProtectedAdminRoute><RoomAvailabilityPage /></ProtectedAdminRoute>} />
                <Route path="/admin/seasons" element={<ProtectedAdminRoute><SeasonManagement /></ProtectedAdminRoute>} />
                <Route path="/admin/prices" element={<ProtectedAdminRoute><PriceManagement /></ProtectedAdminRoute>} />
                <Route path="/admin/children-surcharges" element={<ProtectedAdminRoute><ChildrenSurchargesManagement /></ProtectedAdminRoute>} />
                <Route path="/admin/bookings" element={<ProtectedAdminRoute><AdminBookingsPage /></ProtectedAdminRoute>} />
                <Route path="/admin/bookings-legacy" element={<ProtectedAdminRoute><BookingsManagement /></ProtectedAdminRoute>} />
                <Route path="/admin/accommodations" element={<ProtectedAdminRoute><AccommodationTypeManagement /></ProtectedAdminRoute>} />
                <Route path="/admin/dining" element={<ProtectedAdminRoute><DiningManagement /></ProtectedAdminRoute>} />
                <Route path="/admin/gallery" element={<ProtectedAdminRoute><GalleryManagement /></ProtectedAdminRoute>} />
                <Route path="/admin/guests" element={<ProtectedAdminRoute><GuestDatabase /></ProtectedAdminRoute>} />
                <Route path="/admin/reviews" element={<ProtectedAdminRoute><AdminReviewsPage /></ProtectedAdminRoute>} />
                <Route path="/admin/reviews-analytics" element={<ProtectedAdminRoute><ReviewsAnalyticsPage /></ProtectedAdminRoute>} />
                <Route path="/admin/deals" element={<ProtectedAdminRoute><GuestDealsManagement /></ProtectedAdminRoute>} />
                <Route path="/admin/offer-leads" element={<ProtectedAdminRoute><OfferLeadsPage /></ProtectedAdminRoute>} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster position="top-center" richColors />
            </Router>
          </CartProvider>
        </AdminAuthProvider>
      </GuestAuthProvider>
    </AuthProvider>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>404</h1>
        <p className="text-xl text-foreground/70 mb-6">Page not found</p>
        <a href="/" className="text-primary hover:underline font-medium transition-all duration-200">Return to home</a>
      </div>
    </div>
  );
}

export default App;
