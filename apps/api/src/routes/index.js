import { Router } from 'express';
import healthCheck from './health-check.js';
import stripeRouter from './stripe.js';
import bookingsRouter from './bookings.js';
import emailVerificationRouter from './email-verification.js';
import passwordResetRouter from './password-reset.js';
import roomAllotmentsRouter from './room-allotments.js';
import roomAvailabilityRouter from './room-availability.js';
import reviewsRouter from './reviews.js';
import reviewsAnalyticsRouter from './reviews-analytics.js';
import adminAuthRouter from './admin-auth.js';
import adminPasswordResetRouter from './admin-password-reset.js';
import pmsRouter from './pms.js';
import channelsRouter from './channels.js';
import restaurantRouter from './restaurant.js';
import tourOperatorsRouter from './tour-operators.js';

const router = Router();

export default () => {
    router.get('/health', healthCheck);
    router.use('/stripe', stripeRouter);
    router.use('/bookings', bookingsRouter);
    router.use('/email-verification', emailVerificationRouter);
    router.use('/password-reset', passwordResetRouter);
    router.use('/room-allotments', roomAllotmentsRouter);
    router.use('/room-availability', roomAvailabilityRouter);
    router.use('/reviews', reviewsRouter);
    router.use('/reviews-analytics', reviewsAnalyticsRouter);
    router.use('/admin-auth', adminAuthRouter);
    router.use('/admin-password-reset', adminPasswordResetRouter);
    router.use('/pms', pmsRouter);
    router.use('/channels', channelsRouter);
    router.use('/restaurant', restaurantRouter);
    router.use('/tour-operators', tourOperatorsRouter);

    return router;
};
