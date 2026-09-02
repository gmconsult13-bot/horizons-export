import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { AlertCircle, Download, Search } from 'lucide-react';
import { toast } from 'sonner';

import { AdminLayout } from '@/components/admin/AdminSidebar.jsx';
import { DataTable } from '@/components/admin/DataTable.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import pb from '@/lib/pocketbaseClient.js';
import { checkAdminAuth } from '@/utils/adminSaveUtils.js';

const escapeCsvValue = (value) => {
  const stringValue = String(value ?? '');
  const safeValue = /^[=+\-@]/.test(stringValue) ? `'${stringValue}` : stringValue;
  return `"${safeValue.replace(/"/g, '""')}"`;
};

export default function OfferLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    setError(false);

    try {
      checkAdminAuth();
      const query = searchTerm.trim();
      const filter = query
        ? pb.filter(
            'first_name ~ {:query} || last_name ~ {:query} || email ~ {:query} || phone ~ {:query}',
            { query },
          )
        : '';

      const result = await pb.collection('offer_leads').getList(1, 200, {
        filter,
        sort: '-created',
        $autoCancel: false,
      });

      setLeads(result.items || []);
    } catch (requestError) {
      setError(true);
      setLeads([]);
      toast.error(requestError.message || 'Unable to load offer registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchLeads, 350);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const handleExportCsv = () => {
    if (leads.length === 0) {
      toast.error('No registrations to export.');
      return;
    }

    const rows = [
      ['First name', 'Last name', 'Email', 'Phone', 'Marketing consent', 'Consent date', 'Registered'],
      ...leads.map((lead) => [
        lead.first_name,
        lead.last_name,
        lead.email,
        lead.phone,
        lead.marketing_consent ? 'Yes' : 'No',
        lead.marketing_consent_at || '',
        lead.created || '',
      ]),
    ];

    const csv = `\uFEFF${rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'raya_offer_registrations.csv';
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href);
    link.remove();
  };

  const columns = [
    { header: 'Name', render: (lead) => `${lead.first_name} ${lead.last_name}` },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    {
      header: 'Marketing',
      render: (lead) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
          lead.marketing_consent
            ? 'bg-emerald-500/10 text-emerald-700'
            : 'bg-slate-500/10 text-slate-600'
        }`}>
          {lead.marketing_consent ? 'Consented' : 'Not consented'}
        </span>
      ),
    },
    {
      header: 'Registered',
      render: (lead) => lead.created ? new Date(lead.created).toLocaleString() : 'N/A',
    },
  ];

  return (
    <AdminLayout>
      <Helmet><title>Offer Registrations | Raya Admin</title></Helmet>

      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Offer Registrations</h1>
          <p className="mt-1 text-muted-foreground">Contacts collected by the September landing page</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, email or phone"
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={handleExportCsv} disabled={loading || leads.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Loading registrations...</div>
        ) : error ? (
          <div className="flex flex-col items-center p-12 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive/50" />
            <h2 className="text-xl font-semibold">Unable to load registrations</h2>
            <Button onClick={fetchLeads} variant="outline" className="mt-5">Try Again</Button>
          </div>
        ) : (
          <DataTable columns={columns} data={leads} />
        )}
      </div>
    </AdminLayout>
  );
}
