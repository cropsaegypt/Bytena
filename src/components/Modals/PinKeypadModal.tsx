'use client';

import React, { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { Lock, Delete, ShieldAlert, Fingerprint } from 'lucide-react';

interface PinKeypadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export default function PinKeypadModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'تأكيد رمز الأمان (PIN)',
  description = 'البيانات الصحية والتحاليل الطبية خاصة تماماً، أدخل رمزك السري لفتح الملف',
}: PinKeypadModalProps) {
  const { unlockHealthWithPin, currentUser } = useUser();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDigit = async (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4) {
      setLoading(true);
      const ok = await unlockHealthWithPin(newPin);
      setLoading(false);
      if (ok) {
        setPin('');
        onSuccess();
      } else {
        setError(true);
        setTimeout(() => setPin(''), 600);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl border border-neutral-100 text-center animate-scaleUp">
        
        {/* Icon & Title */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-brand-600 flex items-center justify-center mb-3 shadow-inner">
          <Lock className="w-7 h-7 stroke-[2.2]" />
        </div>

        <h3 className="font-extrabold text-neutral-800 text-lg">{title}</h3>
        <p className="text-xs text-neutral-500 mt-1 mb-5 leading-relaxed">{description}</p>

        {/* PIN Dots Indicator */}
        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  error
                    ? 'bg-rose-500 scale-110 animate-shake'
                    : isFilled
                    ? 'bg-brand-600 scale-110 shadow-md shadow-brand-500/30'
                    : 'bg-neutral-200'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs font-bold text-rose-600 mb-3 flex items-center justify-center gap-1">
            <ShieldAlert className="w-4 h-4" /> رمز الـ PIN غير صحيح، حاول مرة أخرى
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              disabled={loading}
              className="h-13 rounded-2xl bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-200 font-extrabold text-xl text-neutral-800 transition-all active:scale-95 border border-neutral-100 shadow-sm"
            >
              {d}
            </button>
          ))}

          {/* Biometrics quick simulation */}
          <button
            onClick={() => handleDigit('1')}
            className="h-13 rounded-2xl bg-rose-50 hover:bg-rose-100 text-brand-600 flex items-center justify-center transition-all active:scale-95"
            title="بصمة الإصبع أو الوجه"
          >
            <Fingerprint className="w-6 h-6" />
          </button>

          <button
            onClick={() => handleDigit('0')}
            disabled={loading}
            className="h-13 rounded-2xl bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-200 font-extrabold text-xl text-neutral-800 transition-all active:scale-95 border border-neutral-100 shadow-sm"
          >
            0
          </button>

          <button
            onClick={handleDelete}
            disabled={loading}
            className="h-13 rounded-2xl bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-200 text-neutral-500 flex items-center justify-center transition-all active:scale-95 border border-neutral-100"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={onClose}
          className="text-xs font-bold text-neutral-400 hover:text-neutral-600 py-1"
        >
          إلغاء
        </button>

        <p className="text-[10px] text-neutral-400 mt-2">
          (الرمز الافتراضي المبدئي: <span className="font-mono font-bold">1234</span>)
        </p>
      </div>
    </div>
  );
}
