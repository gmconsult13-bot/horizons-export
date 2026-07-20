import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Download, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminSidebar.jsx';
import { DataTable } from '@/components/admin/DataTable.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import pb from '@/lib/pocketbaseClient.js';
import { checkAdminAuth } from '@/utils/adminSaveUtils.js';

export default function GuestDatabase() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchGuests = async () => {
    setLoading(true);
    setError(false);
    try {
      checkAdminAuth();
      let filter = '';
      if (searchTerm) {
        filter = `email ~ "${searchTerm}" || phone ~ "${searchTerm}"`;
      }
      
      const result = await pb.collection('guests').getList(1, 100, { 
        filter, 
        $autoCancel: false 
      });
      
      setGuests(result.items || []);
    } catch (err) {
      setError(true);
      toast.error(err.message || 'Unable to load guests.');
      setGuests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchGuests();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleExportCSV = () => {
    if (guests.length === 0) {
      toast.error('No guests to export.');
      return;
    }
    
    const headers = ['Email', 'Phone', 'Verified', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...guests.map(g => `"${g.email}","${g.phone || ''}","${g.verified || g.emailVerified ? 'Yes' : 'No'}","${g.created ? new Date(g.created).toLocaleDateString() : 'N/A'}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'guest_database.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', render: (r) => r.phone || 'N/A' },
    { 
      header: 'Status', 
      render: (r) => (r.verified || r.emailVerified) ? (
        <span className="inline-flex items-center text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
          Verified
        </span>
      ) : (
        <span className="inline-flex items-center text-xs font-medium text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full">
          Unverified
        </span>
      )
    },
    { header: 'Joined', render: (r) => r.created ? new Date(r.created).toLocaleDateString() : 'N/A' },
  ];

  return (
    <AdminLayout>
      <Helmet><title>Guest Database | Raya Admin</title></Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Guest Database</h1>
          <p className="text-muted-foreground mt-1">View and manage registered guests</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search email or phone" 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={handleExportCSV} disabled={guests.length === 0 || loading}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading guests...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <AlertCircle className="w-12 h-12 text-destructive/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Unable to load guests</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              There was a problem communicating with the database. Please try again later.
            </p>
            <Button onClick={fetchGuests} variant="outline">Try Again</Button>
          </div>
        ) : guests.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p>{searchTerm ? 'No guests found matching your search.' : 'No guests have registered yet.'}</p>
          </div>
        ) : (
          <DataTable columns={columns} data={guests} />
        )}
      </div>
    </AdminLayout>
  );
}