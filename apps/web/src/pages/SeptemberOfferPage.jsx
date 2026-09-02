import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Baby,
  Car,
  Check,
  CheckCircle2,
  Coffee,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';

import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiServerClient from '@/lib/apiServerClient.js';

const OFFER_STORAGE_KEY = 'raya-september-offer-unlocked';
const HERO_IMAGE = 'https://horizons-cdn.hostinger.com/9719a614-3994-48cd-ad44-20d7d067e3db/viber_d-d-d3-4d-nddegdpdud1-2d-du_2026-06-04_14-36-48-252-jvcVW.jpg';
const ROOM_IMAGE = 'https://horizons-cdn.hostinger.com/9719a614-3994-48cd-ad44-20d7d067e3db/8a6c4682de036e5bf720341a5ed179cd.jpg';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  marketingConsent: false,
};

const isValidName = (value) =>
  /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]{0,79}$/u.test(value.trim());

function validateForm(form) {
  const errors = {};
  if (!isValidName(form.firstName)) errors.firstName = 'Въведете валидно име.';
  if (!isValidName(form.lastName)) errors.lastName = 'Въведете валидна фамилия.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Въведете валиден имейл.';
  }

  const digits = (form.phone.match(/\d/g) || []).length;
  if (!/^\+?[\d\s().-]+$/.test(form.phone.trim()) || digits < 8 || digits > 15) {
    errors.phone = 'Въведете валиден телефон.';
  }

  return errors;
}

const fieldClassName = (hasError) =>
  `h-12 bg-white/95 text-slate-950 placeholder:text-slate-400 ${
    hasError ? 'border-red-500 focus-visible:ring-red-500' : 'border-white/30'
  }`;

export default function SeptemberOfferPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offer, setOffer] = useState(null);

  useEffect(() => {
    try {
      const storedOffer = window.sessionStorage.getItem(OFFER_STORAGE_KEY);
      if (storedOffer) setOffer(JSON.parse(storedOffer));
    } catch {
      window.sessionStorage.removeItem(OFFER_STORAGE_KEY);
    }
  }, []);

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setSubmitError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await apiServerClient.fetch('/offer-leads/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success || !data.offer) {
        if (data.details) setErrors(data.details);
        throw new Error(data.error || 'Офертата не можа да бъде отключена.');
      }

      window.sessionStorage.setItem(OFFER_STORAGE_KEY, JSON.stringify(data.offer));
      setOffer(data.offer);
    } catch (error) {
      setSubmitError(error.message || 'Възникна проблем. Моля, опитайте отново.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
        <title>Септемврийска оферта | Raya Boutique</title>
        <meta
          name="description"
          content="Отключете специалната септемврийска оферта на Raya Boutique с три нощувки, закуска и безплатен паркинг."
        />
        <link rel="canonical" href="https://landingpage.rayaboutique.eu/" />
      </Helmet>

      <Header />

      <main>
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-20">
            <img
              src={HERO_IMAGE}
              alt="Raya Boutique в Слънчев бряг"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(2,6,23,0.97)_4%,rgba(2,6,23,0.84)_48%,rgba(2,6,23,0.62)_100%)]" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_18%,rgba(212,175,55,0.22),transparent_35%)]" />

          <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-semibold tracking-wide text-amber-200">
                <Sparkles className="h-4 w-4" /> СЕПТЕМВРИ КРАЙ МОРЕТО
              </div>
              <h1 className="text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
                Още малко лято в Raya Boutique
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-200 sm:text-xl">
                Три нощувки със закуска, безплатен паркинг и безплатен престой за дете до 12 години.
              </p>

              <div className="mt-9 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { icon: Coffee, label: 'Закуска' },
                  { icon: Car, label: 'Паркинг' },
                  { icon: Baby, label: 'Дете до 12 г.' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm">
                    <Icon className="h-5 w-5 text-amber-300" />
                    <span className="font-medium text-white">{label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex items-center gap-4">
                <img
                  src={ROOM_IMAGE}
                  alt="Стая в Raya Boutique"
                  className="h-20 w-28 rounded-2xl border border-white/20 object-cover shadow-2xl"
                />
                <p className="max-w-xs text-sm leading-relaxed text-slate-300">
                  Централна локация в Слънчев бряг, близо до плажа и основните удобства.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="mx-auto w-full max-w-xl"
            >
              <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.09] p-2 shadow-2xl backdrop-blur-xl">
                <div className="rounded-[1.55rem] bg-white p-6 text-slate-950 sm:p-8">
                  {offer ? (
                    <div aria-live="polite">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="h-7 w-7" />
                      </div>
                      <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Офертата е отключена</p>
                      <h2 className="mt-2 text-3xl font-semibold text-slate-950">{offer.title}</h2>

                      <div className="mt-7 flex items-end gap-3 border-y border-slate-200 py-6">
                        <span className="text-6xl font-bold tracking-tight text-slate-950">€{offer.price}</span>
                        <span className="pb-2 text-lg font-semibold text-slate-500">общо / {offer.nights} нощувки</span>
                      </div>

                      <ul className="mt-6 space-y-3">
                        {offer.inclusions.map((item) => (
                          <li key={item} className="flex items-start gap-3 text-base text-slate-700">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>

                      <a
                        href="tel:+359884443484"
                        className="mt-8 flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-amber-400 px-6 text-lg font-bold text-slate-950 shadow-lg transition hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                      >
                        <Phone className="h-5 w-5" /> Обадете се: +359 884 443 484
                      </a>
                      <Button asChild variant="outline" className="mt-3 h-12 w-full border-slate-300 text-base">
                        <Link to="/booking">
                          Онлайн резервация <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      <p className="mt-5 text-sm leading-relaxed text-slate-500">{offer.note}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} noValidate>
                      <div className="flex items-center justify-between gap-5">
                        <div>
                          <p className="text-sm font-bold uppercase tracking-[0.16em] text-amber-700">Само за регистрирани гости</p>
                          <h2 className="mt-2 text-3xl font-semibold text-slate-950">Отключете пакетната цена</h2>
                        </div>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-amber-300">
                          <LockKeyhole className="h-6 w-6" />
                        </div>
                      </div>

                      <p className="mt-4 text-base leading-relaxed text-slate-600">
                        Попълнете задължителните данни и веднага ще видите специалната цена.
                      </p>

                      <div className="mt-7 grid gap-5 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="offer-first-name" className="text-base text-slate-800">Име *</Label>
                          <div className="relative mt-2">
                            <UserRound className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                            <Input
                              id="offer-first-name"
                              autoComplete="given-name"
                              value={form.firstName}
                              onChange={(event) => updateField('firstName', event.target.value)}
                              className={`${fieldClassName(errors.firstName)} pl-10`}
                              aria-invalid={Boolean(errors.firstName)}
                              required
                            />
                          </div>
                          {errors.firstName && <p className="mt-1.5 text-sm text-red-600">{errors.firstName}</p>}
                        </div>

                        <div>
                          <Label htmlFor="offer-last-name" className="text-base text-slate-800">Фамилия *</Label>
                          <Input
                            id="offer-last-name"
                            autoComplete="family-name"
                            value={form.lastName}
                            onChange={(event) => updateField('lastName', event.target.value)}
                            className={`mt-2 ${fieldClassName(errors.lastName)}`}
                            aria-invalid={Boolean(errors.lastName)}
                            required
                          />
                          {errors.lastName && <p className="mt-1.5 text-sm text-red-600">{errors.lastName}</p>}
                        </div>

                        <div>
                          <Label htmlFor="offer-email" className="text-base text-slate-800">Имейл *</Label>
                          <div className="relative mt-2">
                            <Mail className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                            <Input
                              id="offer-email"
                              type="email"
                              inputMode="email"
                              autoComplete="email"
                              value={form.email}
                              onChange={(event) => updateField('email', event.target.value)}
                              className={`${fieldClassName(errors.email)} pl-10`}
                              aria-invalid={Boolean(errors.email)}
                              required
                            />
                          </div>
                          {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        <div>
                          <Label htmlFor="offer-phone" className="text-base text-slate-800">Телефон *</Label>
                          <div className="relative mt-2">
                            <Phone className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                            <Input
                              id="offer-phone"
                              type="tel"
                              inputMode="tel"
                              autoComplete="tel"
                              placeholder="+359..."
                              value={form.phone}
                              onChange={(event) => updateField('phone', event.target.value)}
                              className={`${fieldClassName(errors.phone)} pl-10`}
                              aria-invalid={Boolean(errors.phone)}
                              required
                            />
                          </div>
                          {errors.phone && <p className="mt-1.5 text-sm text-red-600">{errors.phone}</p>}
                        </div>
                      </div>

                      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="offer-marketing-consent"
                            checked={form.marketingConsent}
                            onCheckedChange={(checked) => updateField('marketingConsent', checked === true)}
                            className="mt-1 h-5 w-5"
                          />
                          <Label htmlFor="offer-marketing-consent" className="cursor-pointer text-sm font-normal leading-relaxed text-slate-700">
                            Желая да получавам рекламни предложения от Raya Boutique по имейл, телефон, Viber или WhatsApp. <strong>Незадължително.</strong>
                          </Label>
                        </div>
                      </div>

                      <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-slate-500">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                        Данните са необходими за отключване и обработване на офертата. Рекламното съгласие е по избор и може да бъде оттеглено на info@rayaboutique.eu.
                      </p>

                      {submitError && (
                        <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {submitError}
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-7 h-14 w-full bg-slate-950 text-lg font-bold text-white hover:bg-slate-800"
                      >
                        {isSubmitting ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Записване...</>
                        ) : (
                          <>Отключи офертата <ArrowRight className="ml-2 h-5 w-5" /></>
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
