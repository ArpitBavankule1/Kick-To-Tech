import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: '#fb7185' }}>
            <AlertTriangle size={24} />
            <h3 className="modal-title" style={{ margin: 0 }}>Reset Study Progress?</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ color: 'var(--text-secondary)', padding: '0.25rem' }}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <p className="modal-desc">
          This will permanently wipe all recorded quiz answers from your browser's local storage and reset all knowledge domain masteries back to unassessed baseline.
        </p>

        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="danger-btn"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Yes, Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
};
