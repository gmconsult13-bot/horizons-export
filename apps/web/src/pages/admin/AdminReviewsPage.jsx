import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { format } from 'date-fns';
import { Loader2, Trash2, Search, CheckCircle, XCircle, Eye, EyeOff, MessageSquare as MessageSquareStar } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import apiServerClient from '@/lib/apiServerClient.js';
import pb from '@/lib/pocketbaseClient.js';

const ITEMS_PER_PAGE = 20;

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [stats, setStats] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  
  const [filterVisibility, setFilterVisibility] = useState('all');
  const [filterApproval, setFilterApproval] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [deleteDialogItem, setDeleteDialogItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [page, filterVisibility, filterApproval, searchQuery]);

  const fetchStats = async () => {
    try {
      const response = await apiServerClient.fetch('/reviews/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * ITEMS_PER_PAGE;
      const response = await apiServerClient.fetch(
        `/reviews/admin/all?limit=${ITEMS_PER_PAGE}&offset=${offset}`,
        {
          headers: { 'Authorization': `Bearer ${pb.authStore.token}` }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch reviews');
      
      const data = await response.json();
      let filtered = data.reviews || [];
      
      // Client-side filtering since backend doesn't support complex filters natively
      if (searchQuery) {
        filtered = filtered.filter(r => r.guest_name.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      if (filterVisibility !== 'all') {
        const wantsVisible = filterVisibility === 'visible';
        filtered = filtered.filter(r => r.is_visible === wantsVisible);
      }
      if (filterApproval !== 'all') {
        const wantsApproved = filterApproval === 'approved';
        filtered = filtered.filter(r => r.is_approved === wantsApproved);
      }
      
      setReviews(filtered);
      setTotalReviews(data.total || 0);
    } catch (err) {
      toast.error('Failed to load reviews');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (reviewId, field, currentValue) => {
    try {
      // Optimistic update
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, [field]: !currentValue } : r));
      
      const response = await apiServerClient.fetch(`/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pb.authStore.token}`
        },
        body: JSON.stringify({ [field]: !currentValue })
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      toast.success('Status updated successfully');
      fetchStats(); // Update stats as visibility might have changed
    } catch (err) {
      // Revert on error
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, [field]: currentValue } : r));
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialogItem) return;
    setIsDeleting(true);
    
    try {
      const response = await apiServerClient.fetch(`/reviews/${deleteDialogItem.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${pb.authStore.token}` }
      });
      
      if (!response.ok) throw new Error('Failed to delete review');
      
      toast.success('Review deleted successfully');
      setDeleteDialogItem(null);
      fetchReviews();
      fetchStats();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const calcAvg = (r) => ((r.hotel_rating + r.cleaning_rating + r.service_rating + r.food_rating + r.price_quality_rating) / 5).toFixed(1);

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Guest Reviews | Admin Portal</title>
      </Helmet>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground tracking-tight">Guest Reviews</h1>
          <p className="text-muted-foreground mt-1">Manage, moderate, and analyze feedback from your guests.</p>
        </div>
        <MessageSquareStar className="w-8 h-8 text-primary/40" />
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">Total Published Reviews</div>
              <div className="text-3xl font-bold text-foreground">{stats.total_reviews}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">Average Rating</div>
              <div className="text-3xl font-bold text-primary">
                {((stats.avg_hotel_rating + stats.avg_cleaning_rating + stats.avg_service_rating + stats.avg_food_rating + stats.avg_price_quality_rating) / 5).toFixed(1)} <span className="text-lg text-muted-foreground">/ 6</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">Service Quality</div>
              <div className="text-3xl font-bold text-foreground">{stats.avg_service_rating?.toFixed(1)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">Value for Money</div>
              <div className="text-3xl font-bold text-foreground">{stats.avg_price_quality_rating?.toFixed(1)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters & Table */}
      <Card className="border-border shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-border pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search guest name..." 
                className="pl-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <Select value={filterVisibility} onValueChange={setFilterVisibility}>
                <SelectTrigger className="w-[140px] bg-background">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="visible">Visible Only</SelectItem>
                  <SelectItem value="hidden">Hidden Only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterApproval} onValueChange={setFilterApproval}>
                <SelectTrigger className="w-[150px] bg-background">
                  <SelectValue placeholder="Approval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="unapproved">Needs Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No reviews found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Guest & Date</TableHead>
                    <TableHead>Avg Rating</TableHead>
                    <TableHead className="max-w-[300px]">Opinion</TableHead>
                    <TableHead className="text-center">Visible</TableHead>
                    <TableHead className="text-center">Approved</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{review.guest_name}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(review.created_at), 'MMM d, yyyy')}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-variant-numeric tabular-nums bg-primary/5">
                          {calcAvg(review)} / 6
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="truncate text-sm text-muted-foreground" title={review.opinion}>
                          {review.opinion ? `"${review.opinion}"` : <span className="italic opacity-50">No written feedback</span>}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch 
                          checked={review.is_visible} 
                          onCheckedChange={() => handleToggleStatus(review.id, 'is_visible', review.is_visible)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch 
                          checked={review.is_approved} 
                          onCheckedChange={() => handleToggleStatus(review.id, 'is_approved', review.is_approved)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setDeleteDialogItem(review)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <div className="p-4 border-t flex justify-between items-center bg-muted/10">
            <span className="text-sm text-muted-foreground">
              Showing page {page} of {Math.max(1, Math.ceil(totalReviews / ITEMS_PER_PAGE))}
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1 || isLoading}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={reviews.length < ITEMS_PER_PAGE || isLoading}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteDialogItem} onOpenChange={(open) => !open && setDeleteDialogItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <XCircle className="w-5 h-5" /> Delete Review
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete the review from <strong>{deleteDialogItem?.guest_name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogItem(null)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Confirm Deletion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}