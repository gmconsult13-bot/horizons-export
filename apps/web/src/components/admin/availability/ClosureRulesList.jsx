import React from 'react';
import { toast } from 'sonner';
import { Trash2, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import apiServerClient from '@/lib/apiServerClient.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function ClosureRulesList({ rules, onRulesChanged }) {
  
  const handleToggleActive = async (rule) => {
    try {
      const response = await apiServerClient.fetch(`/room-availability/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_type: rule.rule_type,
          start_date: rule.start_date,
          end_date: rule.end_date,
          day_of_week: rule.day_of_week,
          reason: rule.reason,
          is_active: !rule.is_active
        })
      });

      if (!response.ok) throw new Error('Failed to update rule');
      toast.success('Rule status updated');
      onRulesChanged();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      const response = await apiServerClient.fetch(`/room-availability/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete rule');
      toast.success('Rule deleted successfully');
      onRulesChanged();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!rules || rules.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground flex flex-col items-center border border-dashed rounded-lg bg-muted/10">
        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
        <p>No closure rules active for this room type.</p>
      </div>
    );
  }

  const formatRuleDetails = (rule) => {
    switch (rule.rule_type) {
      case 'closed_date':
        return format(parseISO(rule.start_date.split(' ')[0]), 'MMM dd, yyyy');
      case 'closed_range':
        return `${format(parseISO(rule.start_date.split(' ')[0]), 'MMM dd, yyyy')} - ${format(parseISO(rule.end_date.split(' ')[0]), 'MMM dd, yyyy')}`;
      case 'closed_day_of_week':
        return `Every ${DAYS[rule.day_of_week]}`;
      default:
        return 'Unknown';
    }
  };

  const getRuleBadge = (type) => {
    switch (type) {
      case 'closed_date': return <Badge variant="outline">Single Date</Badge>;
      case 'closed_range': return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Date Range</Badge>;
      case 'closed_day_of_week': return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Recurring</Badge>;
      default: return null;
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="text-center">Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => (
            <TableRow key={rule.id} className={!rule.is_active ? "opacity-60" : ""}>
              <TableCell>{getRuleBadge(rule.rule_type)}</TableCell>
              <TableCell className="font-medium">{formatRuleDetails(rule)}</TableCell>
              <TableCell className="text-muted-foreground max-w-[200px] truncate" title={rule.reason}>
                {rule.reason || '-'}
              </TableCell>
              <TableCell className="text-center">
                <Switch 
                  checked={rule.is_active} 
                  onCheckedChange={() => handleToggleActive(rule)} 
                />
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(rule.id)}
                  title="Delete Rule"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}