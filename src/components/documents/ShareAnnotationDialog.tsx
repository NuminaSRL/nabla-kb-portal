'use client';

import { useState } from 'react';
import { X, Mail, User, Trash2 } from 'lucide-react';
import type { AnnotationShare, SharePermission } from '@/lib/documents/types';

interface ShareAnnotationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (shareWith: { userId?: string; email?: string }, permission: SharePermission) => Promise<void>;
  onRemoveShare: (shareId: string) => Promise<void>;
  existingShares: AnnotationShare[];
  annotationType: 'highlight' | 'note';
}

export function ShareAnnotationDialog({
  isOpen,
  onClose,
  onShare,
  onRemoveShare,
  existingShares,
  annotationType,
}: ShareAnnotationDialogProps) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<SharePermission>('view');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onShare({ email: email.trim() }, permission);
      setEmail('');
      setPermission('view');
    } catch (err: any) {
      setError(err.message || 'Failed to share annotation');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    if (!confirm('Are you sure you want to remove this share?')) return;

    setLoading(true);
    try {
      await onRemoveShare(shareId);
    } catch (err: any) {
      setError(err.message || 'Failed to remove share');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">
            Share {annotationType === 'highlight' ? 'Highlight' : 'Note'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Share form */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Permission
              </label>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as SharePermission)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="view">View only</option>
                <option value="edit">Can edit</option>
              </select>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              onClick={handleShare}
              disabled={loading || !email.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sharing...' : 'Share'}
            </button>
          </div>

          {/* Existing shares */}
          {existingShares.length > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium mb-3">Shared with</h4>
              <div className="space-y-2">
                {existingShares.map(share => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {share.shared_with_user_id ? (
                          <User className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Mail className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {share.shared_with_email || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {share.permission === 'view' ? 'View only' : 'Can edit'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveShare(share.id)}
                      disabled={loading}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/50 rounded text-red-600 dark:text-red-400 disabled:opacity-50"
                      title="Remove share"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              <strong>Note:</strong> Shared users will be able to see this {annotationType} when viewing the document.
              {permission === 'edit' && ' They can also modify or delete it.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

