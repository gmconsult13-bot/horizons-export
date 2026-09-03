import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Loader2, Radio, Plus, RefreshCw, Download, AlertCircle, Check, X, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { toast } from 'sonner';

export default function PMSChannels() {
  const [loading, setLoading] = useState(true);
  const [otas, setOtas] = useState([]);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [perOta, setPerOta] = useState({});
  const [showAddOta, setShowAddOta] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [otasRes, dashRes] = await Promise.all([
        apiServerClient.fetch('/channels/otas'),
        apiServerClient.fetch('/channels/dashboard'),
      ]);
      if (otasRes.ok) setOtas((await otasRes.json()).otas || []);
      if (dashRes.ok) {
        const d = await dashRes.json();
        setPendingBookings(d.pending_imports || 0);
        setPerOta(d.per_ota || {});
      }
    } catch (e) { console.error('Channels fetch error:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const importBooking = async (otaId, bookingId) => {
    try {
      const res = await apiServerClient.fetch(`/channels/otas/${otaId}/import-booking/${bookingId}`, { method: 'POST' });
      if (res.ok) {
        toast.success('Booking imported successfully');
        fetchData();
      }
    } catch (e) { toast.error('Import failed'); }
  };

  const statusBadge = (status) => {
    const colors = {
      connected: 'bg-emerald-100 text-emerald-800',
      pending: 'bg-amber-100 text-amber-800',
      error: 'bg-red-100 text-red-800',
      disconnected: 'bg-muted text-muted-foreground',
    };
    return <span className={`text-xs px-2 py-1 rounded-full ${colors[status] || colors.disconnected}`}>{status}</span>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet><title>Channel Manager | Raya Boutique PMS</title></Helmet>
      <Header />
      <main className="flex-grow py-6">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2"><Radio className="w-7 h-7 text-primary" /> Channel Manager</h1>
              <p className="text-muted-foreground mt-1">Sync rates, availability, and bookings across all OTAs</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchData}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
              <Button onClick={() => setShowAddOta(true)}><Plus className="w-4 h-4 mr-1" /> Add Channel</Button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="w-5 h-5 text-white" /></div>
                <div><div className="text-2xl font-bold">{otas.filter(o => o.connection_status === 'connected').length}</div><div className="text-sm text-muted-foreground">Connected Channels</div></div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-white" /></div>
                <div><div className="text-2xl font-bold">{pendingBookings}</div><div className="text-sm text-muted-foreground">Pending OTA Bookings</div></div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center"><Radio className="w-5 h-5 text-white" /></div>
                <div><div className="text-2xl font-bold">{otas.length}</div><div className="text-sm text-muted-foreground">Total Channels</div></div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-4">
              {/* OTA Cards */}
              {otas.map(ota => (
                <div key={ota.id} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Radio className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{ota.name}</h3>
                        <p className="text-xs text-muted-foreground">Hotel ID: {ota.hotel_id_on_ota || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusBadge(ota.connection_status)}
                      <span className="text-xs text-muted-foreground">{ota.sync_status === 'syncing' ? 'Syncing...' : ota.sync_status || 'Idle'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Commission</p>
                      <p className="font-medium">{ota.commission_rate || '—'}{ota.commission_rate ? '%' : ''}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Last Sync</p>
                      <p className="font-medium">{ota.last_sync ? new Date(ota.last_sync).toLocaleString() : 'Never'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Auto Sync</p>
                      <p className="font-medium">{ota.auto_sync ? `Every ${ota.sync_interval_minutes || 15} min` : 'Off'}</p>
                    </div>
                  </div>

                  {perOta[ota.name] && (
                    <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Bookings (30d):</span> <span className="font-bold">{perOta[ota.name].bookings}</span></div>
                      <div><span className="text-muted-foreground">Revenue:</span> <span className="font-bold">€{(perOta[ota.name].revenue || 0).toFixed(2)}</span></div>
                      <div><span className="text-muted-foreground">Pending Import:</span> <span className="font-bold text-amber-600">{perOta[ota.name].pending_import}</span></div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm"><Link2 className="w-4 h-4 mr-1" /> Room Mappings</Button>
                    <Button variant="outline" size="sm"><RefreshCw className="w-4 h-4 mr-1" /> Push Rates</Button>
                    <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Pull Bookings</Button>
                  </div>
                </div>
              ))}

              {otas.length === 0 && (
                <div className="text-center py-12">
                  <Radio className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-muted-foreground mb-4">No channels connected yet</p>
                  <Button onClick={() => setShowAddOta(true)}><Plus className="w-4 h-4 mr-2" /> Add Your First Channel</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add OTA Form */}
      {showAddOta && (
        <AddOtaModal onClose={() => setShowAddOta(false)} onAdded={() => { fetchData(); setShowAddOta(false); }} />
      )}

      <Footer />
    </div>
  );
}

function AddOtaModal({ onClose, onAdded }) {
  const [formData, setFormData] = useState({ name: '', ota_code: '', hotel_id_on_ota: '', api_username: '', api_password: '', commission_rate: '' });
  const [submitting, setSubmitting] = useState(false);

  const presetChannels = [
    { name: 'Booking.com', ota_code: 'booking_com' },
    { name: 'Agoda', ota_code: 'agoda' },
    { name: 'Expedia', ota_code: 'expedia' },
    { name: 'Airbnb', ota_code: 'airbnb' },
    { name: 'TripAdvisor', ota_code: 'tripadvisor' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiServerClient.fetch('/channels/otas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) { toast.success('Channel added'); onAdded(); }
      else { const d = await res.json(); toast.error(d.error || 'Failed'); }
    } catch (e) { toast.error('Failed to add channel'); }
    finally { setSubmitting(false); }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-2xl z-50 p-6 shadow-2xl">
        <h2 className="text-xl font-bold mb-4">Add Channel</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Select Channel</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {presetChannels.map(ch => (
                <button key={ch.ota_code} type="button"
                  onClick={() => setFormData(p => ({ ...p, name: ch.name, ota_code: ch.ota_code }))}
                  className={`p-3 rounded-lg border text-sm text-left transition-colors ${formData.ota_code === ch.ota_code ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}>
                  {ch.name}
                </button>
              ))}
            </div>
          </div>
          <div><label className="text-sm font-medium">Hotel ID on OTA</label><input className="w-full rounded-md border border-border p-2 mt-1" value={formData.hotel_id_on_ota} onChange={e => setFormData(p => ({ ...p, hotel_id_on_ota: e.target.value }))} /></div>
          <div><label className="text-sm font-medium">API Username</label><input className="w-full rounded-md border border-border p-2 mt-1" value={formData.api_username} onChange={e => setFormData(p => ({ ...p, api_username: e.target.value }))} /></div>
          <div><label className="text-sm font-medium">API Password</label><input type="password" className="w-full rounded-md border border-border p-2 mt-1" value={formData.api_password} onChange={e => setFormData(p => ({ ...p, api_password: e.target.value }))} /></div>
          <div><label className="text-sm font-medium">Commission Rate (%)</label><input type="number" className="w-full rounded-md border border-border p-2 mt-1" value={formData.commission_rate} onChange={e => setFormData(p => ({ ...p, commission_rate: e.target.value }))} placeholder="15" /></div>
          <Button type="submit" className="w-full" disabled={submitting || !formData.ota_code}>{submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Connect Channel</Button>
        </form>
      </div>
    </>
  );
}
