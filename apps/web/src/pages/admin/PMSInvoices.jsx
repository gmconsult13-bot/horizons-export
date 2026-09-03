import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Loader2, FileText, Plus, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';

const DEFAULT_VAT = 20;

export default function PMSInvoices() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const result = await pb.collection('invoices').getList(1, 50, { sort: '-created', $autoCancel: false });
      setInvoices(result.items);
    } catch (e) { console.error('Invoice fetch error:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const filtered = invoices.filter(i => !search || i.invoice_number?.toLowerCase().includes(search.toLowerCase()) || i.guest_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet><title>Invoices | Raya Boutique PMS</title></Helmet>
      <Header />
      <main className="flex-grow py-6">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2"><FileText className="w-7 h-7 text-primary" /> Invoices (Фактури)</h1>
              <p className="text-muted-foreground mt-1">Bulgarian invoice generation with legal compliance</p>
            </div>
            <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" /> New Invoice</Button>
          </div>

          <div className="mb-4 relative max-w-sm">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by invoice # or guest..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Invoice #</th>
                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Guest</th>
                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Date</th>
                    <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Total</th>
                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No invoices yet.</td></tr>
                  ) : filtered.map(inv => (
                    <tr key={inv.id} className="border-b border-border hover:bg-muted/20">
                      <td className="p-4 font-mono text-sm font-medium">{inv.invoice_number || '—'}</td>
                      <td className="p-4 text-sm font-medium">{inv.guest_name || '—'}</td>
                      <td className="p-4 text-sm text-muted-foreground">{inv.invoice_date || '—'}</td>
                      <td className="p-4 text-sm font-bold text-right">€{(inv.total || 0).toFixed(2)}</td>
                      <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : inv.status === 'issued' ? 'bg-blue-100 text-blue-800' : 'bg-muted'}`}>{inv.status || 'draft'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      {showForm && <InvoiceForm onClose={() => setShowForm(false)} onCreated={() => { fetchInvoices(); setShowForm(false); }} />}
      <Footer />
    </div>
  );
}

function InvoiceForm({ onClose, onCreated }) {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([{ description: 'Accommodation', quantity: 1, unit_price: 0, vat_rate: DEFAULT_VAT }]);
  const [client, setClient] = useState({ guest_name: '', is_company: false, eik: '', egn: '', address: '', vat_number: '' });
  const [seller, setSeller] = useState({ name: 'Raya Boutique Hotel', eik: '', address: '', vat_number: '', mol: '' });
  const [meta, setMeta] = useState({ invoice_date: new Date().toISOString().split('T')[0], service_from: '', service_to: '', payment_method: 'cash' });

  useEffect(() => {
    pb.collection('bookings').getList(1, 20, { sort: '-created', filter: 'booking_status != "cancelled"', $autoCancel: false })
      .then(r => setBookings(r.items)).catch(e => console.error(e));
  }, []);

  const selectBooking = (id) => {
    const b = bookings.find(x => x.id === id);
    if (b) {
      setSelectedBooking(id);
      setClient(prev => ({ ...prev, guest_name: b.guest_name || '' }));
      setMeta(prev => ({ ...prev, service_from: b.check_in_date || '', service_to: b.check_out_date || '' }));
      setItems([{ description: `Accommodation — ${b.accommodationType || 'Room'}`, quantity: 1, unit_price: b.final_price || 0, vat_rate: DEFAULT_VAT }]);
    }
  };

  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unit_price)), 0);
  const vatAmount = items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unit_price) * Number(i.vat_rate) / 100), 0);
  const total = subtotal + vatAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let nextNum = '0000001';
      try {
        const last = await pb.collection('invoices').getList(1, 1, { sort: '-invoice_number', $autoCancel: false });
        if (last.items.length > 0 && last.items[0].invoice_number) {
          nextNum = String(parseInt(last.items[0].invoice_number) + 1).padStart(7, '0');
        }
      } catch (e) { /* first */ }

      await pb.collection('invoices').create({
        invoice_number: nextNum, invoice_type: 'invoice', booking_id: selectedBooking || '',
        guest_name: client.guest_name, guest_egn: client.is_company ? '' : client.egn,
        guest_eik: client.is_company ? client.eik : '', guest_address: client.address,
        guest_vat_number: client.vat_number, guest_is_company: client.is_company,
        invoice_date: meta.invoice_date, service_from: meta.service_from, service_to: meta.service_to,
        items_json: JSON.stringify(items), subtotal: Number(subtotal.toFixed(2)),
        vat_rate: DEFAULT_VAT, vat_amount: Number(vatAmount.toFixed(2)),
        total: Number(total.toFixed(2)), currency: 'EUR', status: 'issued',
        payment_method: meta.payment_method, seller_name: seller.name, seller_eik: seller.eik,
        seller_address: seller.address, seller_vat_number: seller.vat_number, seller_mol: seller.mol,
      }, { $autoCancel: false });

      toast.success(`Invoice #${nextNum} created — €${total.toFixed(2)}`);
      onCreated();
    } catch (error) {
      console.error('Invoice error:', error);
      toast.error('Failed to create invoice', { description: error?.message });
    } finally { setSubmitting(false); }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-card border-l border-border z-50 shadow-2xl overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex justify-between items-center sticky top-0 bg-card pb-4 border-b border-border">
            <h2 className="text-2xl font-bold">New Invoice (Нова Фактура)</h2>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>

          {/* Booking link */}
          <div>
            <Label>Link to Booking</Label>
            <select className="w-full rounded-md border border-border p-2" value={selectedBooking || ''} onChange={e => selectBooking(e.target.value)}>
              <option value="">— Select —</option>
              {bookings.map(b => <option key={b.id} value={b.id}>{b.guest_name} — {b.check_in_date}</option>)}
            </select>
          </div>

          {/* Client */}
          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="font-semibold">Client (Клиент)</h3>
            <label className="flex items-center gap-2"><input type="checkbox" checked={client.is_company} onChange={e => setClient(p => ({ ...p, is_company: e.target.checked }))} className="w-4 h-4" /> <span className="text-sm">Company (Юридическо лице)</span></label>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name *</Label><Input value={client.guest_name} onChange={e => setClient(p => ({ ...p, guest_name: e.target.value }))} required /></div>
              {client.is_company ? <div><Label>ЕИК *</Label><Input value={client.eik} onChange={e => setClient(p => ({ ...p, eik: e.target.value }))} required={client.is_company} /></div> : <div><Label>ЕГН</Label><Input value={client.egn} onChange={e => setClient(p => ({ ...p, egn: e.target.value }))} /></div>}
              <div><Label>Address</Label><Input value={client.address} onChange={e => setClient(p => ({ ...p, address: e.target.value }))} /></div>
              <div><Label>VAT Number</Label><Input value={client.vat_number} onChange={e => setClient(p => ({ ...p, vat_number: e.target.value }))} placeholder="BG123456789" /></div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
            <div><Label>Invoice Date *</Label><Input type="date" value={meta.invoice_date} onChange={e => setMeta(p => ({ ...p, invoice_date: e.target.value }))} required /></div>
            <div><Label>Service From</Label><Input type="date" value={meta.service_from} onChange={e => setMeta(p => ({ ...p, service_from: e.target.value }))} /></div>
            <div><Label>Service To</Label><Input type="date" value={meta.service_to} onChange={e => setMeta(p => ({ ...p, service_to: e.target.value }))} /></div>
            <div className="col-span-3"><Label>Payment Method</Label>
              <select className="w-full rounded-md border border-border p-2" value={meta.payment_method} onChange={e => setMeta(p => ({ ...p, payment_method: e.target.value }))}>
                <option value="cash">Cash (В брой)</option><option value="card">Card (Карта)</option><option value="bank_transfer">Bank Transfer (Банков превод)</option>
              </select>
            </div>
          </div>

          {/* Line items */}
          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Line Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, { description: '', quantity: 1, unit_price: 0, vat_rate: DEFAULT_VAT }])}><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end mb-2">
                <div className="col-span-5"><Label>Description</Label><Input value={item.description} onChange={e => setItems(items.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} /></div>
                <div className="col-span-2"><Label>Qty</Label><Input type="number" value={item.quantity} onChange={e => setItems(items.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))} /></div>
                <div className="col-span-2"><Label>Price €</Label><Input type="number" step="0.01" value={item.unit_price} onChange={e => setItems(items.map((x, j) => j === i ? { ...x, unit_price: e.target.value } : x))} /></div>
                <div className="col-span-2"><Label>VAT %</Label><Input type="number" value={item.vat_rate} onChange={e => setItems(items.map((x, j) => j === i ? { ...x, vat_rate: e.target.value } : x))} /></div>
                <div className="col-span-1">{items.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => setItems(items.filter((_, j) => j !== i))}>✕</Button>}</div>
              </div>
            ))}
            <div className="bg-muted/30 rounded-lg p-4 space-y-2 ml-auto max-w-xs mt-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal:</span><span>€{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">VAT (20%):</span><span>€{vatAmount.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg border-t border-border pt-2"><span>Total:</span><span className="text-primary">€{total.toFixed(2)}</span></div>
            </div>
          </div>

          {/* Seller */}
          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="font-semibold">Seller (Продавач)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Hotel Name *</Label><Input value={seller.name} onChange={e => setSeller(p => ({ ...p, name: e.target.value }))} required /></div>
              <div><Label>ЕИК *</Label><Input value={seller.eik} onChange={e => setSeller(p => ({ ...p, eik: e.target.value }))} required /></div>
              <div><Label>Address</Label><Input value={seller.address} onChange={e => setSeller(p => ({ ...p, address: e.target.value }))} /></div>
              <div><Label>VAT Number</Label><Input value={seller.vat_number} onChange={e => setSeller(p => ({ ...p, vat_number: e.target.value }))} /></div>
              <div><Label>Manager / МOL</Label><Input value={seller.mol} onChange={e => setSeller(p => ({ ...p, mol: e.target.value }))} /></div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-card pt-4 border-t border-border">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : <><FileText className="w-4 h-4 mr-2" /> Issue Invoice (Издай Фактура)</>}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
