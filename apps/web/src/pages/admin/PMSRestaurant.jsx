import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Loader2, UtensilsCrossed, Plus, ClipboardList, Table2, Package, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import apiServerClient from '@/lib/apiServerClient.js';

export default function PMSRestaurant() {
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, tablesRes, menuRes, invRes] = await Promise.all([
        apiServerClient.fetch('/restaurant/orders?status=open'),
        apiServerClient.fetch('/restaurant/tables'),
        apiServerClient.fetch('/restaurant/menu'),
        apiServerClient.fetch('/restaurant/inventory'),
      ]);
      if (ordersRes.ok) setOrders((await ordersRes.json()).orders || []);
      if (tablesRes.ok) setTables((await tablesRes.json()).tables || []);
      if (menuRes.ok) setMenu((await menuRes.json()).menu || []);
      if (invRes.ok) setInventory((await invRes.json()).inventory || []);
    } catch (error) {
      console.error('Restaurant fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const tabs = [
    { key: 'orders', label: 'Active Orders', icon: ClipboardList },
    { key: 'tables', label: 'Tables', icon: Table2 },
    { key: 'menu', label: 'Menu', icon: UtensilsCrossed },
    { key: 'inventory', label: 'Inventory', icon: Package },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet><title>Restaurant | Raya Boutique PMS</title></Helmet>
      <Header />
      <main className="flex-grow py-6">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <UtensilsCrossed className="w-7 h-7 text-primary" />
              Restaurant
            </h1>
            <p className="text-muted-foreground mt-1">POS, menu management, table orders, room service, and inventory</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <t.icon className="w-4 h-4 inline mr-1" />
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : tab === 'orders' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 col-span-full">No active orders</p>
              ) : orders.map(o => (
                <div key={o.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold">{o.order_type}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        o.status === 'preparing' ? 'bg-amber-100 text-amber-800' :
                        o.status === 'served' ? 'bg-blue-100 text-blue-800' : 'bg-muted'
                      }`}>{o.status}</span>
                    </div>
                    <span className="font-bold text-primary">€{(o.grand_total || o.total || 0).toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Guests: {o.num_guests}</div>
                    {o.server && <div>Server: {o.server}</div>}
                    <div>Opened: {new Date(o.opened_at).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : tab === 'tables' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {tables.map(t => (
                <div key={t.id} className={`rounded-xl p-4 text-center min-h-[100px] flex flex-col justify-center ${
                  t.current_order ? 'bg-amber-500 text-white' :
                  t.status === 'reserved' ? 'bg-blue-500 text-white' :
                  'bg-emerald-500 text-white'
                }`}>
                  <div className="text-lg font-bold">Table {t.table_number}</div>
                  <div className="text-xs opacity-80">{t.capacity} seats</div>
                  {t.current_order ? <div className="text-xs mt-1">In use</div> : <div className="text-xs mt-1">Free</div>}
                </div>
              ))}
            </div>
          ) : tab === 'menu' ? (
            <div className="space-y-6">
              {menu.map(cat => (
                <div key={cat.id}>
                  <h3 className="font-semibold text-lg mb-3">{cat.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cat.items.map(item => (
                      <div key={item.id} className="bg-card border border-border rounded-lg p-3 flex justify-between">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.description && <div className="text-xs text-muted-foreground">{item.description}</div>}
                        </div>
                        <div className="font-bold">€{item.price.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : tab === 'inventory' ? (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Item</th>
                    <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Unit</th>
                    <th className="text-right p-3 text-sm font-semibold text-muted-foreground">Stock</th>
                    <th className="text-right p-3 text-sm font-semibold text-muted-foreground">Min Stock</th>
                    <th className="text-right p-3 text-sm font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(item => {
                    const low = item.quantity <= (item.min_quantity || 0);
                    return (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/20">
                        <td className="p-3 text-sm font-medium">{item.name}</td>
                        <td className="p-3 text-sm text-muted-foreground">{item.unit}</td>
                        <td className="p-3 text-sm text-right">{item.quantity}</td>
                        <td className="p-3 text-sm text-right text-muted-foreground">{item.min_quantity || '—'}</td>
                        <td className="p-3 text-right">
                          <span className={`text-xs px-2 py-1 rounded-full ${low ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {low ? 'Low!' : 'OK'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
