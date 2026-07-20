import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { BedDouble, Info } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminSidebar.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AccommodationTypeManagement() {
  return (
    <AdminLayout>
      <Helmet><title>Accommodation Types | Admin</title></Helmet>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif">Accommodation Types</h1>
        <p className="text-muted-foreground">Manage property categorization</p>
      </div>

      <Card className="border-border shadow-sm max-w-2xl">
        <CardHeader>
          <div className="flex items-center space-x-2 text-primary mb-2">
            <Info className="w-5 h-5" />
            <CardTitle className="text-lg">System Architecture Notice</CardTitle>
          </div>
          <CardDescription className="text-base leading-relaxed">
            In the current system architecture, accommodation types are intrinsically linked to individual physical rooms. To create a new type of accommodation or manage existing categories, please manage the <strong>Rooms</strong> collection directly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            When guests search for availability, the system aggregates available unique room names and presents them as bookable categories based on their capacity and base pricing.
          </p>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link to="/admin/rooms">
              <BedDouble className="w-4 h-4 mr-2" />
              Go to Room Management
            </Link>
          </Button>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}