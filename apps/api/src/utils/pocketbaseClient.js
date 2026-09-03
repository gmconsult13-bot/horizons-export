import PocketBase from 'pocketbase';
import logger from './logger.js';

const POCKETBASE_URL =
    process.env.POCKETBASE_URL?.trim() ||
    process.env.PB_URL?.trim() ||
    'http://127.0.0.1:8090';

const SUPERUSER_EMAIL = process.env.PB_SUPERUSER_EMAIL?.trim();
const SUPERUSER_PASSWORD = process.env.PB_SUPERUSER_PASSWORD;
const BOOKING_ADMIN_EMAIL = process.env.BOOKING_ADMIN_EMAIL?.trim().toLowerCase();
const BOOKING_ADMIN_PASSWORD = process.env.BOOKING_ADMIN_PASSWORD;

const pocketbaseClient = new PocketBase(POCKETBASE_URL);

pocketbaseClient.autoCancellation(false);

let authenticationPromise = null;

const delay = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForPocketBase({
    retries = 10,
    delayMs = 1000,
} = {}) {
    for (let attempt = 1; attempt <= retries; attempt += 1) {
        try {
            const response = await fetch(`${POCKETBASE_URL}/api/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });

            if (response.ok) {
                logger.info(`PocketBase is available at ${POCKETBASE_URL}`);
                return true;
            }

            logger.warn(
                `PocketBase health check returned HTTP ${response.status} ` +
                `(${attempt}/${retries})`,
            );
        } catch (error) {
            logger.warn(
                `PocketBase not reachable at ${POCKETBASE_URL} ` +
                `(${attempt}/${retries}): ${error.message}`,
            );
        }

        if (attempt < retries) {
            await delay(delayMs);
        }
    }

    return false;
}

async function findUserByEmail(email) {
    const escapedEmail = email
        .replaceAll('\\', '\\\\')
        .replaceAll('"', '\\"');

    try {
        return await pocketbaseClient
            .collection('users')
            .getFirstListItem(`email = "${escapedEmail}"`);
    } catch (error) {
        if (error?.status === 404) {
            return null;
        }

        throw error;
    }
}

async function synchronizeProductionAdmin() {
    if (!BOOKING_ADMIN_EMAIL || !BOOKING_ADMIN_PASSWORD) {
        logger.error(
            'Booking administrator credentials are missing. ' +
            'Set BOOKING_ADMIN_EMAIL and BOOKING_ADMIN_PASSWORD in Hostinger.',
        );

        return false;
    }

    for (const prototypeEmail of ['admin@example.com', 'admin@hotel.com']) {
        const prototypeUser = await findUserByEmail(prototypeEmail);

        if (prototypeUser) {
            await pocketbaseClient.collection('users').delete(prototypeUser.id);
            logger.info(`Removed prototype administrator: ${prototypeEmail}`);
        }
    }

    const existingAdmin = await findUserByEmail(BOOKING_ADMIN_EMAIL);
    const adminData = {
        email: BOOKING_ADMIN_EMAIL,
        is_admin: true,
        name: 'Raya Boutique Admin',
        role: 'admin',
        verified: true,
    };

    if (existingAdmin) {
        // Keep the administrator's current password. Otherwise every server
        // restart would silently undo a successful "forgot password" reset.
        await pocketbaseClient.collection('users').update(
            existingAdmin.id,
            adminData,
        );
    } else {
        await pocketbaseClient.collection('users').create({
            ...adminData,
            password: BOOKING_ADMIN_PASSWORD,
            passwordConfirm: BOOKING_ADMIN_PASSWORD,
        });
    }

    logger.info('Production booking administrator synchronized successfully');
    return true;
}

async function authenticateSuperuser() {
    if (pocketbaseClient.authStore.isValid) {
        return true;
    }

    if (!SUPERUSER_EMAIL || !SUPERUSER_PASSWORD) {
        logger.error(
            'PocketBase superuser credentials are missing. ' +
            'Set PB_SUPERUSER_EMAIL and PB_SUPERUSER_PASSWORD in apps/api/.env.',
        );

        return false;
    }

    if (!authenticationPromise) {
        authenticationPromise = pocketbaseClient
            .collection('_superusers')
            .authWithPassword(SUPERUSER_EMAIL, SUPERUSER_PASSWORD)
            .then(async () => {
                logger.info('PocketBase superuser authenticated successfully');
                return synchronizeProductionAdmin();
            })
            .catch((error) => {
                pocketbaseClient.authStore.clear();

                logger.error(
                    `PocketBase superuser authentication failed: ${
                        error?.response?.message ||
                        error?.message ||
                        'Unknown authentication error'
                    }`,
                );

                return false;
            })
            .finally(() => {
                authenticationPromise = null;
            });
    }

    return authenticationPromise;
}

async function createAuthenticatedSuperuserClient() {
    if (!SUPERUSER_EMAIL || !SUPERUSER_PASSWORD) {
        throw new Error('PocketBase superuser credentials are missing');
    }

    const client = new PocketBase(POCKETBASE_URL);
    client.autoCancellation(false);

    await client
        .collection('_superusers')
        .authWithPassword(SUPERUSER_EMAIL, SUPERUSER_PASSWORD);

    return client;
}

async function initializePocketBase() {
    const isAvailable = await waitForPocketBase();

    if (!isAvailable) {
        logger.error(
            `PocketBase could not be reached at ${POCKETBASE_URL}. ` +
            'The API will stay running, but database operations will fail ' +
            'until PocketBase becomes available.',
        );

        return false;
    }

    return authenticateSuperuser();
}

/*
 * Authenticate once when the API starts.
 *
 * We deliberately do not use process.exit(1) here. A temporary PocketBase
 * problem should not immediately terminate the complete API process.
 */
initializePocketBase().catch((error) => {
    logger.error(
        `Unexpected PocketBase initialization error: ${
            error?.message || error
        }`,
    );
});

export {
    authenticateSuperuser,
    createAuthenticatedSuperuserClient,
    initializePocketBase,
    pocketbaseClient,
    POCKETBASE_URL,
};

export default pocketbaseClient;
