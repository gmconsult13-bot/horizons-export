import { Router } from 'express';

import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = Router();

const OFFER = Object.freeze({
  key: 'september-3-nights-2026',
  title: 'Септемврийски пакет в Raya Boutique',
  price: 200,
  currency: 'EUR',
  nights: 3,
  inclusions: [
    'Закуска',
    'Безплатен паркинг',
    'Дете до 12 години – безплатно',
  ],
  note: 'Офертата е валидна според наличността и се потвърждава от хотела.',
});

const CONSENT_VERSION = 'marketing-v1-2026-09-02';
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]{0,79}$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARACTERS_PATTERN = /^\+?[\d\s().-]+$/;

const cleanText = (value, maxLength) =>
  typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
    : '';

function validateLead(body = {}) {
  const lead = {
    first_name: cleanText(body.firstName, 80),
    last_name: cleanText(body.lastName, 80),
    email: cleanText(body.email, 254).toLowerCase(),
    phone: cleanText(body.phone, 30),
    marketing_consent: body.marketingConsent === true,
  };

  const errors = {};

  if (!NAME_PATTERN.test(lead.first_name)) {
    errors.firstName = 'Моля, въведете валидно име.';
  }

  if (!NAME_PATTERN.test(lead.last_name)) {
    errors.lastName = 'Моля, въведете валидна фамилия.';
  }

  if (!EMAIL_PATTERN.test(lead.email)) {
    errors.email = 'Моля, въведете валиден имейл адрес.';
  }

  const phoneDigitCount = (lead.phone.match(/\d/g) || []).length;
  if (
    !PHONE_CHARACTERS_PATTERN.test(lead.phone) ||
    phoneDigitCount < 8 ||
    phoneDigitCount > 15
  ) {
    errors.phone = 'Моля, въведете валиден телефонен номер.';
  }

  return { lead, errors };
}

router.post('/unlock', async (req, res) => {
  const { lead, errors } = validateLead(req.body);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Проверете задължителните полета.',
      details: errors,
    });
  }

  const now = new Date().toISOString();
  const payload = {
    ...lead,
    marketing_consent_at: lead.marketing_consent ? now : '',
    consent_version: CONSENT_VERSION,
    source: 'september-offer-landing-page',
    offer_key: OFFER.key,
  };

  let record;

  try {
    const existing = await pb
      .collection('offer_leads')
      .getFirstListItem(pb.filter('email = {:email}', { email: lead.email }), {
        requestKey: null,
      });

    record = await pb.collection('offer_leads').update(existing.id, payload, {
      requestKey: null,
    });
  } catch (error) {
    if (Number(error?.status) !== 404) throw error;

    record = await pb.collection('offer_leads').create(payload, {
      requestKey: null,
    });
  }

  logger.info(`September offer unlocked for lead record ${record.id}`);

  return res.status(200).json({
    success: true,
    registrationId: record.id,
    offer: OFFER,
  });
});

export default router;
