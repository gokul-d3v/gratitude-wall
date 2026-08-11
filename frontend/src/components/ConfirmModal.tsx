import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#fffcf9] rounded-2xl shadow-2xl border border-black/10 p-6 sm:p-8 animate-fade-slide-up"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
          title="Close popup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Icon */}
        <div className="flex flex-col items-center text-center gap-3">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-inner ${
              isDestructive ? 'bg-rose-100 text-rose-600 ring-8 ring-rose-50' : 'bg-blue-100 text-[#0058bd] ring-8 ring-blue-50'
            }`}
          >
            {isDestructive ? <Trash2 className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-sans text-[#191c1d] tracking-tight mt-1">
            {title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs">
            {message}
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-center gap-3 mt-8 pt-4 border-t border-black/5">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm border border-slate-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-6 py-2.5 rounded-full font-semibold text-xs sm:text-sm text-white shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-[#0058bd] hover:bg-[#004494]'
            }`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};