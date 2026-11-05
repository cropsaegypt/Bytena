'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { 
  Home, 
  UtensilsCrossed, 
  WalletCards, 
  Activity, 
  Sparkles, 
  Plus,
  Moon
} from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { openQuickAction } = useUser();

  const isAssistantOrLogin = pathname === '/assistant' || pathname === '/login';

  const navItems = [
    { label: 'الرئيسية', href: '/', icon: Home },
    { label: 'مطبخنا', href: '/kitchen', icon: UtensilsCrossed },
    { 
      label: 'مصاريف وطلبات', 
      href: '/shopping', 
      icon: WalletCards, 
      matchHrefs: ['/shopping', '/finance'] 
    },
    { label: 'صحتنا', href: '/health', icon: Activity },
    { label: 'صلاتنا', href: '/prayers', icon: Moon },
    { label: 'أم محمود', href: '/assistant', icon: Sparkles },
  ];

  if (pathname === '/login') return null;

  return (
    <>
      {/* Floating Action Button (FAB) - Hidden on Assistant page so it never covers the Send button */}
      {!isAssistantOrLogin && (
        <div className="fixed bottom-20 left-4 z-40 md:left-8">
          <button
            onClick={openQuickAction}
            className="w-13 h-13 p-3.5 rounded-full bg-gradient-to-r from-brand-600 to-rose-500 text-white shadow-xl shadow-brand-500/35 hover:scale-110 active:scale-95 transition-all flex items-center justify-center border-2 border-white"
            title="إجراء سريع"
            aria-label="إجراء سريع"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Main Bottom App Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 glass-nav border-t border-neutral-200/80 px-2 py-1.5 transition-all">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.matchHrefs
              ? item.matchHrefs.includes(pathname)
              : pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                  isActive
                    ? 'text-brand-600 font-extrabold scale-105'
                    : 'text-neutral-400 hover:text-neutral-600 font-medium'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-rose-50' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight font-bold">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-brand-600 rounded-full absolute -bottom-0.5"></span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
