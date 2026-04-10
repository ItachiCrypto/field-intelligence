// @ts-nocheck
'use client';

import { AlertTriangle } from 'lucide-react';
import { Modal } from './modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Supprimer',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-50">
          <AlertTriangle className="w-6 h-6 text-rose-500" />
        </div>
        <p className="text-sm text-slate-600">{message}</p>
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Suppression...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
