'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Info, Trash2, X } from 'lucide-react';
import styles from '../app/admin/page.module.css';

export interface DialogState {
  isOpen: boolean;
  type?: 'info' | 'success' | 'warning' | 'danger' | 'confirm';
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface CustomDialogModalProps extends DialogState {
  onClose: () => void;
}

export default function CustomDialogModal({
  isOpen,
  type = 'info',
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  onClose
}: CustomDialogModalProps) {
  if (!isOpen) return null;

  const isConfirmType = type === 'confirm' || type === 'danger';

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 size={26} style={{ color: '#ef4444' }} />;
      case 'warning':
        return <AlertTriangle size={26} style={{ color: '#f59e0b' }} />;
      case 'success':
        return <CheckCircle2 size={26} style={{ color: '#10b981' }} />;
      case 'confirm':
        return <AlertTriangle size={26} style={{ color: '#14b8a6' }} />;
      default:
        return <Info size={26} style={{ color: '#14b8a6' }} />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'danger':
        return 'rgba(239, 68, 68, 0.15)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.15)';
      case 'success':
        return 'rgba(16, 185, 129, 0.15)';
      default:
        return 'rgba(20, 184, 166, 0.15)';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  return (
    <div 
      className={styles.figmaModalOverlay} 
      style={{ 
        zIndex: 99999, 
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(0, 0, 0, 0.65)'
      }}
      onClick={handleCancel}
    >
      <div 
        className={styles.figmaModal} 
        style={{ 
          maxWidth: '430px', 
          width: '90%', 
          padding: '1.75rem',
          borderRadius: '16px',
          background: 'var(--adm-modal-bg, var(--adm-card-bg, #161b22))',
          border: '1px solid var(--adm-border, rgba(255, 255, 255, 0.12))',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
          {/* Glowing Icon Badge */}
          <div style={{
            width: '58px',
            height: '58px',
            borderRadius: '50%',
            backgroundColor: getIconBg(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: type === 'danger' ? '0 0 20px rgba(239, 68, 68, 0.25)' : '0 0 20px var(--adm-accent-light, rgba(20, 184, 166, 0.25))'
          }}>
            {getIcon()}
          </div>

          {/* Title */}
          {title && (
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--adm-text-primary, #ffffff)' }}>
              {title}
            </h3>
          )}

          {/* Message Content */}
          {message && (
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--adm-text-secondary, #94a3b8)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
              {message}
            </p>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
            {isConfirmType && (
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid var(--adm-border, rgba(255, 255, 255, 0.12))',
                  background: 'var(--adm-input-bg, rgba(255, 255, 255, 0.05))',
                  color: 'var(--adm-text-primary, #cbd5e1)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {cancelText}
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '10px',
                border: 'none',
                background: type === 'danger' 
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                  : 'var(--adm-accent-gradient, var(--adm-accent, #14b8a6))',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: type === 'danger' 
                  ? '0 4px 15px rgba(239, 68, 68, 0.4)' 
                  : '0 4px 15px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease'
              }}
            >
              {confirmText || (isConfirmType ? 'Confirm' : 'OK')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
