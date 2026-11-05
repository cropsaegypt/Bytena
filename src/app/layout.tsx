import type { Metadata } from 'next';
import './globals.css';
import { UserProvider } from '@/context/UserContext';
import TopBar from '@/components/Navigation/TopBar';
import BottomNav from '@/components/Navigation/BottomNav';
import QuickActionModal from '@/components/Modals/QuickActionModal';
import PWAInstaller from '@/components/PWA/PWAInstaller';
import LoveNotificationToast from '@/components/Notifications/LoveNotificationToast';

export const metadata: Metadata = {
  title: 'بيتنا | BAYTNA ❤️ - فادي ورحمة',
  description: 'النظام المتكامل لإدارة حياة فادي ورحمة ومنزلهما، الوجبات، التسوق، والميزانية',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'بيتنا',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#e11d48" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="font-cairo bg-[#fdfaf8] text-neutral-900 antialiased selection:bg-rose-100 selection:text-brand-900 min-h-screen flex flex-col justify-between">
        <UserProvider>
          {/* Main App Container */}
          <div className="w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto min-h-screen flex flex-col bg-white shadow-xl shadow-rose-950/5 relative">
            <TopBar />
            <PWAInstaller />
            <LoveNotificationToast />
            
            {/* Scrollable Content Area */}
            <main className="flex-1 pb-safe pt-2 px-3.5 sm:px-4">
              {children}
            </main>

            <BottomNav />
            <QuickActionModal />
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
