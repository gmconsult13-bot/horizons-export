import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Loader2, FileText, Plus, Briefcase, Users, TrendingUp, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import apiServerClient from '@/lib/apiServerClient.js';

export default function PMSTourOperators() {
  const [tab, setTab] = useState('operators');
  const [operators, setOperators] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [opRes, invRes] = await Promise.all([
        apiServerClient.fetch('/tour-operators'),
        apiServerClient.fetch('/tour-operators/invoices'),
      ]);
      if (opRes.ok) setOperators((await opRes.json()).tour_operators || []);
      if (invRes.ok) setInvoices((await invRes.json()).invoices || []);
    } catch (e) { console.error('TO fetch error:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const tabs = [
    { key: 'operators', label: 'Tour Operators', icon: Briefcase },
    { key: 'invoices', label: 'TO Invoices', icon: FileText },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet><title>Tour Operators | Raya Boutique PMS</title></Helmet>
      <Header />
      <main className="flex-grow py-6">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Briefcase className="w-7 h-7 text-primary" />
              Tour Operator Contracts
            </h1>
            <p className="text-muted-foreground mt-1">Manage contracts, allotments, rooming lists, and TO billing</p>
          </div>

          <div className="flex gap-2 mb-6 border-b border-border">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}>
                <t.icon className="w-4 h-4 inline mr-1" />{t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : tab === 'operators' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {operators.map(op => (
                <div key={op.id} className="bg-card border border-border rounded-xl p-5 space-y-2">
                  <h3 className="font-semibold text-lg">{op.name}</h3>
                  {op.country && <p className="text-sm text-muted-foreground">{op.country}</p>}
                  {op.contact_name && <p className="text-sm">{op.contact_name}</p>}
                  {op.commission_rate > 0 && <p className="text-sm">Commission: {op.commission_rate}%</p>}
                  <div className="text-sm text-muted-foreground">
                    Billing: {op.billing_cycle} • {op.currency}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full inline-block ${op.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-muted'}`}>
                    {op.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              ))}
              {operators.length === 0 && <p className="text-muted-foreground text-center col-span-full py-8">No tour operators yet. Click "Add Operator" to create.</p>}
            </div>
          ) : tab === 'invoices' ? (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold">Invoice #</th>
                    <th className="text-left p-4 text-sm font-semibold">Period</th>
                    <th className="text-right p-4 text-sm font-semibold">Subtotal</th>
                    <th className="text-right p-4 text-sm font-semibold">Commission</th>
                    <th className="text-right p-4 text-sm font-semibold">Total</th>
                    <th className="text-left p-4 text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>{invoices.length === 0 ? (<tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No TO invoices issued yet.</td></tr>) : (
                  invoices.map(inv => (
                    <tr key={inv.id} className="border-b border-border hover:bg-muted/20">
                      <td className="p-4 font-mono text-sm font-medium">{inv.invoice_number}</td>
                      <td className="p-4 text-sm">{inv.period_from} — {inv.period_to}</td>
                      <td className="p-4 text-sm text-right">€{(inv.subtotal || 0).toFixed(2)}</td>
                      <td className="p-4 text-sm text-right text-muted-foreground">€{(inv.commission_total || 0).toFixed(2)}</td>
                      <td className="p-4 text-sm font-bold text-right">€{(inv.total || 0).toFixed(2)}</td>
                      <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : inv.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{inv.status}</span></td>
                    </tr>
                  ))
                )}</tbody>
              </table>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
