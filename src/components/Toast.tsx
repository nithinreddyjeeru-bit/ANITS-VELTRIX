"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  body?: string;
}

interface ConfirmState {
  id: number;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
  resolve: (ok: boolean) => void;
}

interface ToastContextType {
  toast: (type: ToastType, title: string, body?: string) => void;
  success: (title: string, body?: string) => void;
  error: (title: string, body?: string) => void;
  warning: (title: string, body?: string) => void;
  info: (title: string, body?: string) => void;
  confirm: (opts: {
    title: string;
    body?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
  }) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ACCENT: Record<ToastType, { color: string; Icon: typeof CheckCircle }> = {
  success: { color: "var(--green)", Icon: CheckCircle },
  error: { color: "var(--pink)", Icon: XCircle },
  warning: { color: "var(--orange)", Icon: AlertTriangle },
  info: { color: "var(--blue)", Icon: Info },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, title: string, body?: string) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, type, title, body }]);
    setTimeout(() => remove(id), 4200);
  }, [remove]);

  const confirm = useCallback((opts: {
    title: string; body?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean;
  }) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        id: ++idRef.current,
        title: opts.title,
        body: opts.body,
        confirmLabel: opts.confirmLabel ?? "CONFIRM",
        cancelLabel: opts.cancelLabel ?? "CANCEL",
        danger: opts.danger ?? false,
        resolve,
      });
    });
  }, []);

  const settle = (ok: boolean) => {
    confirmState?.resolve(ok);
    setConfirmState(null);
  };

  const value: ToastContextType = {
    toast,
    success: (t, b) => toast("success", t, b),
    error: (t, b) => toast("error", t, b),
    warning: (t, b) => toast("warning", t, b),
    info: (t, b) => toast("info", t, b),
    confirm,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast stack */}
      <div
        style={{
          position: "fixed", top: "84px", right: "20px", zIndex: 5000,
          display: "flex", flexDirection: "column", gap: "12px", maxWidth: "360px", width: "calc(100vw - 40px)",
          pointerEvents: "none",
        }}
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const { color, Icon } = ACCENT[t.type];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 60, rotate: 2 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                exit={{ opacity: 0, x: 60, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                style={{
                  pointerEvents: "auto",
                  background: "white",
                  border: "4px solid var(--black)",
                  boxShadow: "6px 6px 0 var(--black)",
                  borderLeft: `10px solid ${color}`,
                  padding: "14px 16px",
                  display: "flex", gap: "12px", alignItems: "flex-start",
                }}
              >
                <Icon size={22} style={{ color, flexShrink: 0, marginTop: "2px" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-bebas" style={{ fontSize: "1.15rem", letterSpacing: "0.5px", lineHeight: 1.1 }}>{t.title}</div>
                  {t.body && <div className="font-space" style={{ fontSize: "0.85rem", opacity: 0.75, marginTop: "3px" }}>{t.body}</div>}
                </div>
                <button onClick={() => remove(t.id)} aria-label="Dismiss"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, opacity: 0.5, flexShrink: 0 }}>
                  <X size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmState && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(11,11,11,0.6)", zIndex: 6000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
            onClick={() => settle(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 16, rotate: -1 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.9, y: 16, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "white", border: "4px solid var(--black)", boxShadow: "10px 10px 0 var(--black)",
                padding: "32px", maxWidth: "440px", width: "100%",
              }}
            >
              <div className="sticker" style={{ background: confirmState.danger ? "var(--pink)" : "var(--green)", color: confirmState.danger ? "white" : "black", marginBottom: "18px" }}>
                {confirmState.danger ? "HEADS UP" : "CONFIRM"}
              </div>
              <h2 className="font-bangers" style={{ fontSize: "2rem", lineHeight: 1, marginBottom: "10px" }}>{confirmState.title}</h2>
              {confirmState.body && <p className="font-space" style={{ opacity: 0.75, lineHeight: 1.5 }}>{confirmState.body}</p>}
              <div style={{ display: "flex", gap: "12px", marginTop: "26px" }}>
                <button className="btn" style={{ flex: 1, justifyContent: "center" }} onClick={() => settle(false)}>
                  {confirmState.cancelLabel}
                </button>
                <button
                  className={`btn ${confirmState.danger ? "btn-pink" : "btn-green"}`}
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => settle(true)}
                  autoFocus
                >
                  {confirmState.confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
