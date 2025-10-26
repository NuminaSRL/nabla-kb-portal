'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Play, Trash2, Edit, Clock } from 'lucide-react';
import { SavedSearch } from '@/lib/saved-searches/saved-search-service';
import { SavedSearchDialog } from './SavedSearchDialog';
import { AlertSettingsDialog } from './AlertSettingsDialog';
import { useToast } from '@/components/ui/use-toast';

export function SavedSearchesList() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [limit, setLimit] = useState(0);
  const [selectedSearch, setSelectedSearch] = useState<SavedSearch | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/saved-searches');
      const data = await response.json();

      if (response.ok) {
        setSavedSearches(data.saved_searches);
        setCount(data.count);
        setLimit(data.limit);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load saved searches',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to load saved searches:', error);
      toast({
        title: 'Error',
        description: 'Failed to load saved searches',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSearch = async (search: SavedSearch) => {
    try {
      const response = await fetch(`/api/saved-searches/${search.id}/execute`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Navigate to search results or show in modal
        window.location.href = `/search?saved=${search.id}`;
      } else {
        toast({
          title: 'Error',
          description: 'Failed to execute search',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to execute search:', error);
      toast({
        title: 'Error',
        description: 'Failed to execute search',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAlert = async (search: SavedSearch) => {
    try {
      const response = await fetch(`/api/saved-searches/${search.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_enabled: !search.alert_enabled }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Alerts ${!search.alert_enabled ? 'enabled' : 'disabled'}`,
        });
        loadSavedSearches();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update alert settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to toggle alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to update alert settings',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSearch = async (search: SavedSearch) => {
    if (!confirm(`Are you sure you want to delete "${search.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/saved-searches/${search.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Saved search deleted',
        });
        loadSavedSearches();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete saved search',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to delete search:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete saved search',
        variant: 'destructive',
      });
    }
  };

  const handleEditSearch = (search: SavedSearch) => {
    setSelectedSearch(search);
    setShowEditDialog(true);
  };

  const handleAlertSettings = (search: SavedSearch) => {
    setSelectedSearch(search);
    setShowAlertDialog(true);
  };

  const formatFrequency = (frequency: string) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading saved searches...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Saved Searches</h2>
          <p className="text-muted-foreground">
            {count} of {limit === -1 ? 'unlimited' : limit} saved searches
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          disabled={limit !== -1 && count >= limit}
        >
          Create Saved Search
        </Button>
      </div>

      {savedSearches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-muted-foreground mb-4">No saved searches yet</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              Create Your First Saved Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {savedSearches.map((search) => (
            <Card key={search.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {search.name}
                      {search.alert_enabled && (
                        <Badge variant="secondary" className="ml-2">
                          <Bell className="h-3 w-3 mr-1" />
                          {formatFrequency(search.alert_frequency)}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {search.query}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleExecuteSearch(search)}
                      title="Execute search"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditSearch(search)}
                      title="Edit search"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleToggleAlert(search)}
                      title={search.alert_enabled ? 'Disable alerts' : 'Enable alerts'}
                    >
                      {search.alert_enabled ? (
                        <Bell className="h-4 w-4" />
                      ) : (
                        <BellOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleAlertSettings(search)}
                      title="Alert settings"
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteSearch(search)}
                      title="Delete search"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Created: {formatDate(search.created_at)}</span>
                  {search.last_alert_sent_at && (
                    <span>Last alert: {formatDate(search.last_alert_sent_at)}</span>
                  )}
                  {search.last_result_count > 0 && (
                    <span>{search.last_result_count} results</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SavedSearchDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={loadSavedSearches}
      />

      {selectedSearch && (
        <>
          <SavedSearchDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            savedSearch={selectedSearch}
            onSuccess={loadSavedSearches}
          />
          <AlertSettingsDialog
            open={showAlertDialog}
            onOpenChange={setShowAlertDialog}
            savedSearch={selectedSearch}
            onSuccess={loadSavedSearches}
          />
        </>
      )}
    </div>
  );
}
