"use client";

import React, { Fragment, useState, useEffect } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { ShieldCheck, X } from "lucide-react";

export interface ModerationActionOption {
  action: string;
  label: string;
  variant?: "success" | "danger" | "warning" | "default";
  requiresNote?: boolean;
}

export interface ModerationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { action: string; note: string }) => void | Promise<void>;
  title: string;
  targetDescription?: string;
  availableActions: ModerationActionOption[];
  isLoading?: boolean;
}

export function ModerationReviewModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  targetDescription,
  availableActions,
  isLoading = false,
}: ModerationReviewModalProps) {
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setSelectedAction(availableActions[0]?.action || "");
      setNote("");
      setErrorMsg("");
    }
  }, [isOpen, availableActions]);

  const activeOption = availableActions.find((a) => a.action === selectedAction);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction) {
      setErrorMsg("Pilih salah satu tindakan keputusan.");
      return;
    }

    if (activeOption?.requiresNote && !note.trim()) {
      setErrorMsg(`Catatan review wajib diisi untuk tindakan "${activeOption.label}".`);
      return;
    }

    setErrorMsg("");
    onSubmit({ action: selectedAction, note: note.trim() });
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={isLoading ? () => {} : onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all border border-border-subtle">
                <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 text-primary flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <DialogTitle as="h3" className="text-base font-bold text-slate-900 font-heading">
                        {title}
                      </DialogTitle>
                      {targetDescription && (
                        <p className="text-xs text-slate-500 mt-0.5">{targetDescription}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
                    aria-label="Tutup"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Pilih Keputusan Tindakan
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {availableActions.map((opt) => {
                        const isSelected = selectedAction === opt.action;
                        return (
                          <button
                            key={opt.action}
                            type="button"
                            onClick={() => {
                              setSelectedAction(opt.action);
                              setErrorMsg("");
                            }}
                            className={`px-3 py-2.5 rounded-lg text-sm font-medium border text-left transition-all ${
                              isSelected
                                ? opt.variant === "danger"
                                  ? "border-red-500 bg-red-50 text-accent-danger-accessible font-semibold"
                                  : opt.variant === "success"
                                  ? "border-emerald-500 bg-emerald-50 text-accent-emerald-accessible font-semibold"
                                  : opt.variant === "warning"
                                  ? "border-amber-500 bg-amber-50 text-accent-amber-accessible font-semibold"
                                  : "border-primary bg-indigo-50 text-primary font-semibold"
                                : "border-border-subtle hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{opt.label}</span>
                              {opt.requiresNote && (
                                <span className="text-[10px] text-slate-400 ml-1">(catatan)</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="review-note"
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
                    >
                      Catatan Audit / Alasan{" "}
                      {activeOption?.requiresNote ? (
                        <span className="text-red-600">*wajib</span>
                      ) : (
                        <span className="text-slate-400 font-normal">(opsional)</span>
                      )}
                    </label>
                    <textarea
                      id="review-note"
                      rows={3}
                      value={note}
                      onChange={(e) => {
                        setNote(e.target.value);
                        if (errorMsg) setErrorMsg("");
                      }}
                      placeholder={
                        activeOption?.requiresNote
                          ? "Berikan alasan atau catatan perbaikan yang jelas..."
                          : "Tambahkan catatan penjelas jika diperlukan..."
                      }
                      className="w-full text-sm rounded-lg border border-border-subtle p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-2.5 rounded-lg bg-red-50 text-accent-danger-accessible text-xs font-medium">
                      {errorMsg}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isLoading}
                      className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isLoading ? "Menyimpan..." : "Kirim Keputusan"}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
