'use client';

import React, { useEffect, useState } from 'react';
import { Smartphone, Download, X, Share, CheckCircle2 } from 'lucide-react';

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('[PWA] Service Worker registered:', reg.scope))
          .catch((err) => console.warn('[PWA] Service Worker registration failed:', err));
      });
    }

    // 2. Check if already installed / standalone
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // 3. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Capture beforeinstallprompt for Android / Desktop Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check localStorage if previously dismissed
    const isDismissed = localStorage.getItem('baytna_pwa_dismissed') === 'true';
    if (isDismissed) {
      setDismissed(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) {
      alert('لتثبيت التطبيق على جهازك: افتح خيارات المتصفح (⋮) واختر "تثبيت التطبيق" أو "إضافة للشاشة الرئيسية"');
      return;
    }

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('baytna_pwa_dismissed', 'true');
  };

  // If already running inside installed PWA app, don't show the banner
  if (isStandalone) return null;

  return (
    <>
      {/* Floating Install Prompt Banner (Visible on mobile/desktop browsers) */}
      {!dismissed && (
        <div className="fixed top-14 left-0 right-0 z-50 px-2.5 sm:px-3 pointer-events-none flex justify-center transition-all animate-in fade-in slide-in-from-top-4 w-full max-w-full">
          <div className="w-full max-w-md md:max-w-xl pointer-events-auto bg-gradient-to-r from-brand-600 via-rose-600 to-amber-600 text-white rounded-2xl p-2.5 sm:p-3 shadow-xl shadow-rose-950/20 border border-white/20 flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="text-right min-w-0">
                <div className="font-black text-xs sm:text-sm flex items-center gap-1 truncate">
                  <span className="truncate">تثبيت تطبيق بيتنا ❤️</span>
                  <span className="text-[9px] sm:text-[10px] bg-white/30 px-1.5 py-0.5 rounded-full font-bold shrink-0">موبايل</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-rose-100 font-medium truncate">
                  وصول سريع من شاشة الهاتف بدون متصفح
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="bg-white text-brand-600 hover:bg-rose-50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black shadow-md flex items-center gap-1 transition-transform active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تثبيت</span>
              </button>
              <button
                onClick={handleDismiss}
                className="text-white/70 hover:text-white p-1 rounded-lg transition-colors"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Installation Instruction Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-neutral-800 shadow-2xl space-y-4 animate-in slide-in-from-bottom-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-rose-50 text-brand-600 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-neutral-900">تثبيت بيتنا على الآيفون 📱</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm font-medium text-neutral-600">
              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-neutral-50 border border-neutral-100">
                <span className="w-6 h-6 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <p>
                  اضغط على زر <strong className="text-neutral-900 font-bold">المشاركة (Share)</strong>{' '}
                  <Share className="w-3.5 h-3.5 inline mx-1 text-brand-600" /> في أسفل شاشة المتصفح (Safari).
                </p>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-neutral-50 border border-neutral-100">
                <span className="w-6 h-6 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <p>
                  مرر للأسفل واختر <strong className="text-neutral-900 font-bold">"إضافة إلى الصفحة الرئيسية"</strong> (Add to Home Screen ➕).
                </p>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  سيظهر تطبيق بيتنا بأيقونته الجميلة على شاشة جهازك كأي تطبيق رسمي!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-3 bg-brand-600 text-white rounded-2xl font-bold shadow-md hover:bg-brand-700 transition-colors"
            >
              فهمت، شكراً ✨
            </button>
          </div>
        </div>
      )}
    </>
  );
}
