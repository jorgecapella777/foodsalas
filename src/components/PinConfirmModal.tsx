import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { getSecurityPin } from '../utils/supabaseClient';

interface PinConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PinConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel
}: PinConfirmModalProps) {
  const [pinValue, setPinValue] = useState('');
  const [step, setStep] = useState<'confirm' | 'pin'>('confirm'); // 'confirm' -> 'pin'
  const [correctPin, setCorrectPin] = useState('151224');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Load latest configured pin when modal opens
  useEffect(() => {
    if (isOpen) {
      setPinValue('');
      setStep('confirm');
      setErrorMsg('');
      setIsVerifying(true);
      getSecurityPin()
        .then(pin => setCorrectPin(pin))
        .finally(() => setIsVerifying(false));
    }
  }, [isOpen]);

  const handleNextToPin = () => {
    setStep('pin');
  };

  const handleSubmitPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinValue === correctPin) {
      onConfirm();
    } else {
      setErrorMsg('PIN de Seguridad Incorrecto. Acción cancelada por seguridad.');
      setPinValue('');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 15, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.35 }}
          className="relative w-full max-w-md bg-white border border-slate-150 rounded-3xl shadow-2xl p-6 overflow-hidden z-10"
        >
          {step === 'confirm' ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center border border-amber-200">
                <ShieldAlert className="w-6 h-6 text-amber-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-bold">{message}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleNextToPin}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-xs"
                >
                  Sí, Confirmar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitPin} className="space-y-4">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-200">
                  <ShieldAlert className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Verificación de Seguridad</h3>
                  <p className="text-xs text-slate-500 font-bold leading-relaxed">
                    Ingrese el PIN de Seguridad de 6 dígitos para autorizar y completar esta acción.
                  </p>
                </div>
              </div>

              {errorMsg ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 animate-shake text-red-700 text-[11px] font-bold">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              ) : null}

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="password"
                    maxLength={10}
                    value={pinValue}
                    onChange={(e) => {
                      setErrorMsg('');
                      setPinValue(e.target.value.replace(/\D/g, ''));
                    }}
                    placeholder="••••••"
                    className="w-full text-center tracking-[0.5em] text-lg font-black bg-slate-50 border border-slate-205 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    required
                    autoFocus
                    disabled={isVerifying}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep('confirm')}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                    disabled={isVerifying}
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center justify-center gap-1.5"
                    disabled={isVerifying || pinValue.length === 0}
                  >
                    Autorizar Acción
                  </button>
                </div>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
