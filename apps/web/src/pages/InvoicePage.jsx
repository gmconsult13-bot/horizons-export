import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Printer, Loader2, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import pb from '@/lib/pocketbaseClient.js';

// Invoices stay printable for 3 months after the stay.
const PRINTABLE_MONTHS = 3;

function isPrintableExpired(checkOutDate) {
  if (!checkOutDate) return false;
  const end = new Date(checkOutDate);
  end.setMonth(end.getMonth() + PRINTABLE_MONTHS);
  return new Date() > end;
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function eur(value) {
  return `€${Number(value || 0).toFixed(2)}`;
}

export default function InvoicePage() {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const record = await pb.collection('invoices').getOne(invoiceId, {
          expand: 'booking',
          $autoCancel: false,
        });
        setInvoice(record);
      } catch (err) {
        console.error('Failed to load invoice:', err);
        setError('Invoice not found or you do not have access to it.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Helmet><title>Invoice | Raya Boutique</title></Helmet>
        <Header />
        <main className="flex-grow flex items-center justify-center py-16 px-4">
          <div className="max-w-md text-center">
            <p className="text-lg font-medium mb-2">Invoice unavailable</p>
            <p className="text-muted-foreground text-sm mb-6">{error}</p>
            <Button asChild variant="outline">
              <Link to="/guest/bookings"><ArrowLeft className="w-4 h-4 mr-2" /> Back to my bookings</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const booking = invoice.expand?.booking;
  const expired = booking ? isPrintableExpired(booking.check_out_date) : false;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet><title>Фактура {invoice.invoice_number} | Raya Boutique</title></Helmet>
      <Header />

      <main className="flex-grow py-10 px-4 print:py-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6 print:hidden">
            <Button asChild variant="outline" size="sm">
              <Link to="/guest/bookings"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Link>
            </Button>
            {!expired && (
              <Button size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" /> Print / Save as PDF
              </Button>
            )}
          </div>

          {expired ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <CalendarClock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h1 className="text-xl font-medium mb-2">Printable period has expired</h1>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Invoices are available for printing up to {PRINTABLE_MONTHS} months after your stay.
                If you need a copy of invoice №{invoice.invoice_number}, please contact us at
                <a href="mailto:info@rayaboutique.eu" className="text-primary ml-1">info@rayaboutique.eu</a>.
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 md:p-10 print:border-0 print:shadow-none print:p-0">
              {/* Title */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-wide">ФАКТУРА</h1>
                  <p className="text-sm text-muted-foreground mt-1">{invoice.original_copy || 'ОРИГИНАЛ'}</p>
                </div>
                <div className="text-right text-sm space-y-1">
                  <p><span className="text-muted-foreground">№ </span><span className="font-semibold">{invoice.invoice_number}</span></p>
                  <p><span className="text-muted-foreground">Дата на издаване: </span>{formatDate(invoice.issue_date)}</p>
                  <p><span className="text-muted-foreground">Данъчно събитие: </span>{formatDate(invoice.tax_event_date)}</p>
                </div>
              </div>

              {/* Seller / Buyer */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="border rounded-lg p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Издател / Seller</p>
                  <p className="font-medium">{invoice.seller_name}</p>
                  <p className="text-sm text-muted-foreground">{invoice.seller_address}</p>
                  <p className="text-sm text-muted-foreground">ЕИКА/БУЛСТАТ: {invoice.seller_eik}</p>
                  {invoice.seller_vat_number && (
                    <p className="text-sm text-muted-foreground">ДДС №: {invoice.seller_vat_number}</p>
                  )}
                  {invoice.seller_mol && (
                    <p className="text-sm text-muted-foreground">Представляващ: {invoice.seller_mol}</p>
                  )}
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Получател / Buyer</p>
                  <p className="font-medium">{invoice.guest_name}</p>
                  {invoice.guest_address && <p className="text-sm text-muted-foreground">{invoice.guest_address}</p>}
                  {invoice.guest_identifier && (
                    <p className="text-sm text-muted-foreground">ЕГН/ЕИКА: {invoice.guest_identifier}</p>
                  )}
                  {invoice.guest_country && <p className="text-sm text-muted-foreground">{invoice.guest_country}</p>}
                </div>
              </div>

              {/* Line items */}
              <table className="w-full border-collapse mb-6 text-sm">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left py-2 px-2 font-semibold">№</th>
                    <th className="text-left py-2 px-2 font-semibold">Описание на сделката</th>
                    <th className="text-right py-2 px-2 font-semibold">Данъчна основа</th>
                    <th className="text-right py-2 px-2 font-semibold">ДДС %</th>
                    <th className="text-right py-2 px-2 font-semibold">ДДС сума</th>
                    <th className="text-right py-2 px-2 font-semibold">Общо</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-2">1</td>
                    <td className="py-2 px-2">{invoice.description}</td>
                    <td className="py-2 px-2 text-right">{eur(invoice.net_amount)}</td>
                    <td className="py-2 px-2 text-right">{Number(invoice.vat_rate || 0)}%</td>
                    <td className="py-2 px-2 text-right">{eur(invoice.vat_amount)}</td>
                    <td className="py-2 px-2 text-right font-medium">{eur(invoice.total_amount)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="py-2 px-2 text-right font-semibold">Общо за плащане / Total due</td>
                    <td className="py-2 px-2 text-right font-bold text-base">{eur(invoice.total_amount)} {invoice.currency}</td>
                  </tr>
                </tfoot>
              </table>

              <p className="text-sm text-muted-foreground">
                Начин на плащане / Payment method: {invoice.payment_method || '—'}
              </p>
              {booking && (
                <p className="text-sm text-muted-foreground">
                  Резервация / Booking ref: {booking.id}
                </p>
              )}

              <div className="mt-10 grid grid-cols-2 gap-8 text-sm">
                <div>
                  <p className="text-muted-foreground mb-8">Издател:</p>
                  <div className="border-t pt-1">
                    <p className="font-medium">{invoice.seller_name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-8">Получател:</p>
                  <div className="border-t pt-1">
                    <p className="font-medium">{invoice.guest_name}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
