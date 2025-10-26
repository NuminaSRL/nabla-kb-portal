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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SavedSearch, SearchAlert } from '@/lib/saved-searches/saved-search-service';
import { useToast } from '@/components/ui/use-toast';
import { Bell, Mail, Clock } from 'lucide-react';

interface AlertSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savedSearch: SavedSearch;
  onSuccess: () => void;
}

export function AlertSettingsDialog({
  open,
  onOpenChange,
  savedSearch,
  onSuccess,
}: AlertSettingsDialogProps) {
  const [alertEnabled, setAlertEnabled] = useState(savedSearch.alert_enabled);
  const [alertFrequency, setAlertFrequency] = useState<'daily' | 'weekly' | 'monthly'>(
    savedSearch.alert_frequency
  );
  const [alerts, setAlerts] = useState<SearchAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadAlerts();
    }
  }, [open]);

  const loadAlerts = async () => {
    try {
      setLoadingAlerts(true);
      const response = await fetch(`/api/saved-searches/${savedSearch.id}/alerts?limit=5`);
      const data = await response.json();

      if (response.ok) {
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/saved-searches/${savedSearch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_enabled: alertEnabled,
          alert_frequency: alertFrequency,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Alert settings updated',
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update alert settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to update alert settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update alert settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Alert Settings</DialogTitle>
          <DialogDescription>
            Configure alerts for "{savedSearch.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="alert-enabled" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Enable Alerts
              </Label>
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
              <Label htmlFor="frequency" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Alert Frequency
              </Label>
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
              <p className="text-sm text-muted-foreground">
                How often you want to receive alert emails
              </p>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Recent Alerts
              </CardTitle>
              <CardDescription>
                History of alerts sent for this search
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAlerts ? (
                <p className="text-sm text-muted-foreground">Loading alerts...</p>
              ) : alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No alerts sent yet</p>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {alert.new_documents_count} new document
                          {alert.new_documents_count !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(alert.alert_sent_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.email_sent ? (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            Email sent
                          </span>
                        ) : (
                          <span className="text-xs text-red-600 dark:text-red-400">
                            Email failed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {savedSearch.last_alert_sent_at && (
            <div className="text-sm text-muted-foreground">
              Last alert sent: {formatDate(savedSearch.last_alert_sent_at)}
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
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
