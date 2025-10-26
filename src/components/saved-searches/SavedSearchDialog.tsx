'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SavedSearch } from '@/lib/saved-searches/saved-search-service';
import { useToast } from '@/components/ui/use-toast';

interface SavedSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savedSearch?: SavedSearch;
  onSuccess: () => void;
}

export function SavedSearchDialog({
  open,
  onOpenChange,
  savedSearch,
  onSuccess,
}: SavedSearchDialogProps) {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [alertFrequency, setAlertFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (savedSearch) {
      setName(savedSearch.name);
      setQuery(savedSearch.query);
      setAlertEnabled(savedSearch.alert_enabled);
      setAlertFrequency(savedSearch.alert_frequency);
    } else {
      setName('');
      setQuery('');
      setAlertEnabled(false);
      setAlertFrequency('weekly');
    }
  }, [savedSearch, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !query.trim()) {
      toast({
        title: 'Error',
        description: 'Name and query are required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const url = savedSearch
        ? `/api/saved-searches/${savedSearch.id}`
        : '/api/saved-searches';
      const method = savedSearch ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          query,
          alert_enabled: alertEnabled,
          alert_frequency: alertFrequency,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: savedSearch
            ? 'Saved search updated'
            : 'Saved search created',
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to save search',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to save search:', error);
      toast({
        title: 'Error',
        description: 'Failed to save search',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {savedSearch ? 'Edit Saved Search' : 'Create Saved Search'}
            </DialogTitle>
            <DialogDescription>
              {savedSearch
                ? 'Update your saved search settings'
                : 'Save this search to quickly access it later and receive alerts for new documents'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., GDPR Updates"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="query">Search Query</Label>
              <Input
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., GDPR compliance requirements"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="alert-enabled">Enable Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when new documents match this search
                </p>
              </div>
              <Switch
                id="alert-enabled"
                checked={alertEnabled}
                onCheckedChange={setAlertEnabled}
              />
            </div>

            {alertEnabled && (
              <div className="grid gap-2">
                <Label htmlFor="frequency">Alert Frequency</Label>
                <Select
                  value={alertFrequency}
                  onValueChange={(value: any) => setAlertFrequency(value)}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : savedSearch ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
