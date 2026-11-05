'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { Heart, X, Bell, Sparkles } from 'lucide-react';
import { 
  LoveNotificationPayload, 
  LOVE_MESSAGES_CATALOG, 
  triggerLoveNotification,
  requestNotificationPermission 
} from '@/lib/love-notifications';

export default function LoveNotificationToast() {
  const { currentUser } = useUser();
  const [currentNotification, setCurrentNotification] = useState<LoveNotificationPayload | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(true);
  const [showPermissionBanner, setShowPermissionBanner] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        setHasPermission(false);
        const dismissed = localStorage.getItem('baytna_notif_banner_dismissed') === 'true';
        if (!dismissed) setShowPermissionBanner(true);
      }
    }

    // 2. Listen to love notification events
    const handleLoveEvent = (e: CustomEvent<LoveNotificationPayload>) => {
      setCurrentNotification(e.detail);
      // Auto dismiss after 7 seconds
      const timer = setTimeout(() => {
        setCurrentNotification((prev) => (prev?.id === e.detail.id ? null : prev));
      }, 7000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('baytna_love_notification' as any, handleLoveEvent);

    // 3. Periodic Love Spark (Every 15 minutes of app usage)
    const periodicInterval = setInterval(() => {
      const sparks = LOVE_MESSAGES_CATALOG.PERIODIC_SPARKS;
      const randomSpark = sparks[Math.floor(Math.random() * sparks.length)];
      triggerLoveNotification({
        type: 'PERIODIC_SPARK',
        fromUserId: currentUser.id === 'fady' ? 'rahma' : 'fady',
        title: randomSpark.title,
        body: randomSpark.body,
        emoji: '❤️',
      });
    }, 15 * 60 * 1000);

    return () => {
      window.removeEventListener('baytna_love_notification' as any, handleLoveEvent);
      clearInterval(periodicInterval);
    };
  }, [currentUser.id]);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setHasPermission(granted);
    setShowPermissionBanner(false);
    if (granted) {
      triggerLoveNotification({
        type: 'LOVE_NOTE',
        fromUserId: currentUser.id === 'fady' ? 'fady' : 'rahma',
        title: 'تم تفعيل إشعارات الحب على الموبايل! 🔔❤️',
        body: 'دلوقتي أي دعوة أو طبخة أو رسالة حب هتوصلكم مباشرة على شاشة الهاتف فوراً ✨',
      });
    }
  };

  const handleDismissPermission = () => {
    setShowPermissionBanner(false);
    localStorage.setItem('baytna_notif_banner_dismissed', 'true');
  };

  return (
    <>
      {/* 1. Floating Love Toast */}
      {currentNotification && (
        <div className="fixed top-3 left-0 right-0 z-50 px-2.5 sm:px-3 pointer-events-none flex justify-center transition-all animate-in fade-in slide-in-from-top-6 duration-300 w-full max-w-full">
          <div className="w-full max-w-md md:max-w-xl pointer-events-auto bg-gradient-to-r from-rose-600 via-brand-600 to-pink-600 text-white rounded-3xl p-3 sm:p-3.5 shadow-2xl shadow-rose-950/30 border-2 border-white/30 backdrop-blur-md flex items-start justify-between gap-2.5 sm:gap-3 relative overflow-hidden">
            {/* Background shimmer */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

            <div className="flex items-start gap-2.5 sm:gap-3 relative z-10 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shrink-0 shadow-inner border border-white/30">
                {currentNotification.fromUserId === 'fady' ? '👨🏻‍💻' : '👩🏻‍🍳'}
              </div>

              <div className="text-right flex-1 min-w-0">
                <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm">
                  <span className="truncate">{currentNotification.title}</span>
                  <Heart className="w-3.5 h-3.5 fill-white text-white animate-ping shrink-0" />
                </div>
                <p className="text-[11px] sm:text-xs text-rose-100 font-medium leading-relaxed mt-0.5 line-clamp-2">
                  {currentNotification.body}
                </p>
              </div>
            </div>

            <button
              onClick={() => setCurrentNotification(null)}
              className="text-white/80 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors shrink-0 relative z-10"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Optional Prompt to Enable Real Mobile Lockscreen Push Notifications */}
      {showPermissionBanner && !hasPermission && (
        <div className="fixed bottom-24 left-0 right-0 z-40 px-2.5 sm:px-3 pointer-events-none flex justify-center animate-in slide-in-from-bottom-4 w-full max-w-full">
          <div className="w-full max-w-md pointer-events-auto bg-white rounded-2xl p-2.5 sm:p-3 shadow-xl border border-rose-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-brand-600 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div className="text-right">
                <h4 className="text-xs font-black text-neutral-800">إشعارات بيتنا على الموبايل 🔔</h4>
                <p className="text-[10px] text-neutral-500 font-medium">
                  علشان يجيلك إشعار حب لما الطرف التاني يطبخ أو يصلي
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleEnableNotifications}
                className="bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-sm transition-transform active:scale-95"
              >
                تفعيل
              </button>
              <button
                onClick={handleDismissPermission}
                className="text-neutral-400 hover:text-neutral-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
