/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Download, CheckCircle2, X, FileText, FileCode, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ToastData {
  id: string;
  title: string;
  message: string;
  format?: 'csv' | 'json' | string;
  fileName?: string;
  recordCount?: number;
  durationMs?: number;
}

interface ToastNotificationProps {
  toast: ToastData | null;
  isDark: boolean;
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toast,
  isDark,
  onClose,
}) => {
  const [progress, setProgress] = useState<number>(100);

  useEffect(() => {
    if (!toast) return;

    const duration = toast.durationMs || 4000;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    setProgress(100);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return Math.max(0, prev - step);
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [toast, onClose]);

  return (
    <AnimatePresence>
      {toast && (
        <div 
          className="fixed bottom-6 right-6 z-[9999] pointer-events-auto max-w-sm w-[calc(100vw-3rem)]"
          role="status"
          aria-live="polite"
        >
          <motion.div
            id="toast-export-notification"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`relative overflow-hidden rounded-[20px] p-4 shadow-2xl border transition-all ${
              isDark
                ? 'bg-[#161b22]/95 border-[#30363d] text-neutral-100 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-md'
                : 'bg-white/95 border-neutral-200 text-neutral-900 shadow-xl backdrop-blur-md'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Icon Container with subtle glow */}
              <div className="w-9 h-9 rounded-[12px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Download className="w-5 h-5 animate-bounce" style={{ animationDuration: '1.4s' }} />
              </div>

              {/* Text & Metadata */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {toast.title}
                  </span>
                  {toast.format && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full uppercase font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                      {toast.format}
                    </span>
                  )}
                </div>

                <p className={`text-xs mt-1 leading-snug line-clamp-2 ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                  {toast.message}
                </p>

                {toast.fileName && (
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-neutral-400 truncate">
                    {toast.format === 'csv' ? (
                      <FileText className="w-3 h-3 text-amber-400 shrink-0" />
                    ) : (
                      <FileCode className="w-3 h-3 text-sky-400 shrink-0" />
                    )}
                    <span className="truncate">{toast.fileName}</span>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                id="btn-toast-dismiss"
                type="button"
                onClick={onClose}
                aria-label="Dismiss notification"
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                  isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Bottom Progress Countdown Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
              <div
                className="h-full bg-emerald-500 transition-all duration-75 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
