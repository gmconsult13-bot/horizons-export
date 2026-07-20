import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TestSeasonsPage() {
  const [formData, setFormData] = useState({
    name: 'Test Season',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    pricing_multiplier: 1.5
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setErrorDetails(null);

    // Prepare data
    const submitData = {
      name: formData.name,
      start_date: formData.start_date,
      end_date: formData.end_date,
      pricing_multiplier: Number(formData.pricing_multiplier)
    };

    console.log('--- TEST SEASON CREATION ---');
    console.log('Submitting Data:', submitData);
    console.log('User:', pb.authStore.model);
    console.log('Token:', pb.authStore.token);

    try {
      const record = await pb.collection('seasons').create(submitData, { $autoCancel: false });
      setResult(record);
      console.log('Success!', record);
    } catch (err) {
      console.error('Creation Error:', err);
      setErrorDetails({
        status: err.status,
        data: err.data,
        message: err.message,
        isAbort: err.isAbort
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <Helmet><title>Diagnostics: Test Seasons</title></Helmet>
      
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-serif mb-2">Seasons Diagnostic Test</h1>
          <p className="text-muted-foreground">
            This page attempts to directly create a season record to isolate frontend form issues from backend rejection issues.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border p-6 rounded-xl space-y-4 shadow-sm">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input 
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input 
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Multiplier</Label>
            <Input 
              type="number"
              step="0.1"
              value={formData.pricing_multiplier}
              onChange={(e) => setFormData({...formData, pricing_multiplier: e.target.value})}
              required
            />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full mt-4">
            {loading ? 'Creating...' : 'Test Direct PocketBase Creation'}
          </Button>
        </form>

        {result && (
          <div className="p-6 bg-secondary/10 border border-secondary/20 rounded-xl">
            <h2 className="text-lg font-semibold text-secondary-foreground mb-4">Success! Record Created</h2>
            <pre className="text-xs bg-background p-4 rounded border border-border overflow-auto text-foreground">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {errorDetails && (
          <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-xl">
            <h2 className="text-lg font-semibold text-destructive mb-4">Error Details</h2>
            <pre className="text-xs bg-background p-4 rounded border border-border overflow-auto text-destructive">
              {JSON.stringify(errorDetails, null, 2)}
            </pre>
            <p className="mt-4 text-sm text-muted-foreground">
              Please check the browser console for even more details. If <code>data</code> contains validation errors, the PocketBase schema requires something the form is not providing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}