"use client";

import React from "react";
import { useToast, ToastItem } from "@/context/ToastContext";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export function ToastItemView({ toast }: { toast: ToastItem }) {
  const { removeToast } = useToast();

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-accent-emerald-accessible flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-accent-danger-accessible flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-accent-amber-accessible flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-primary flex-shrink-0" />,
  };

  const borders = {
    success: "border-l-4 border-l-match-emerald bg-white text-slate-800",
    error: "border-l-4 border-l-red-600 bg-white text-slate-800",
    warning: "border-l-4 border-l-amber-500 bg-white text-slate-800",
    info: "border-l-4 border-l-primary bg-white text-slate-800",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 p-4 rounded-lg shadow-lg border border-border-subtle max-w-sm w-full transition-all duration-200 ${borders[toast.type]}`}
    >
      {icons[toast.type]}
      <div className="flex-1 text-sm font-medium leading-snug">
        {toast.message}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-slate-400 hover:text-slate-600 transition-colors -mr-1 -mt-1 p-1 rounded-md"
        aria-label="Tutup notifikasi"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifikasi sistem"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-auto"
    >
      {toasts.map((toast) => (
        <ToastItemView key={toast.id} toast={toast} />
      ))}
    </aside>
  );
}
