import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm?: () => void;
  isLoading?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmLabel,
  confirmVariant = 'primary',
  onConfirm,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-md bg-panel border border-border rounded-xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary p-1 rounded-md hover:bg-secondary-bg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {description && (
          <p className="text-sm text-text-secondary mb-4">{description}</p>
        )}

        {children && <div className="mb-6">{children}</div>}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          {confirmLabel && onConfirm && (
            <Button
              variant={confirmVariant}
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
