'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@/lib/types';

export interface ClientUser {
  id: string;
  displayName: string;
  role: UserRole;
  avatar: string;
  householdId: string;
  greetingTitle: string;
}

interface UserContextType {
  currentUser: ClientUser;
  switchUser: (userId: 'fady' | 'rahma') => void;
  isHealthUnlocked: boolean;
  unlockHealthWithPin: (pin: string) => Promise<{ success: boolean; isDefaultPin?: boolean }>;
  lockHealth: () => void;
  isQuickActionOpen: boolean;
  openQuickAction: () => void;
  closeQuickAction: () => void;
  quickActionInitialTab: string | null;
  setQuickActionInitialTab: (tab: string | null) => void;
}

const FADY_USER: ClientUser = {
  id: 'fady',
  displayName: 'فادي',
  role: 'OWNER_FADY',
  avatar: '👨🏻‍💻',
  householdId: 'baytna-main',
  greetingTitle: 'يا باشا',
};

const RAHMA_USER: ClientUser = {
  id: 'rahma',
  displayName: 'رحمة',
  role: 'OWNER_RAHMA',
  avatar: '👩🏻‍🍳',
  householdId: 'baytna-main',
  greetingTitle: 'يا ست الكل',
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<ClientUser>(FADY_USER);
  const [isHealthUnlocked, setIsHealthUnlocked] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [quickActionInitialTab, setQuickActionInitialTab] = useState<string | null>(null);

  useEffect(() => {
    // Load persisted user selection from localStorage
    const saved = localStorage.getItem('baytna_active_user');
    if (saved === 'rahma') {
      setCurrentUser(RAHMA_USER);
    } else {
      setCurrentUser(FADY_USER);
    }
  }, []);

  const switchUser = (userId: 'fady' | 'rahma') => {
    const selected = userId === 'rahma' ? RAHMA_USER : FADY_USER;
    setCurrentUser(selected);
    setIsHealthUnlocked(false); // Relock health data when switching user
    localStorage.setItem('baytna_active_user', userId);
    // Send cookie update in background
    fetch('/api/auth/switch-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }).catch(() => {});
  };

  const unlockHealthWithPin = async (pin: string): Promise<{ success: boolean; isDefaultPin?: boolean }> => {
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, pin }),
      });
      const data = await res.json();
      if (data.success) {
        setIsHealthUnlocked(true);
        return { success: true, isDefaultPin: !!data.isDefaultPin };
      }
      return { success: false };
    } catch {
      // Offline fallback: check default '0000' or '1234'
      if (pin === '0000' || pin === '1234') {
        setIsHealthUnlocked(true);
        return { success: true, isDefaultPin: true };
      }
      return { success: false };
    }
  };

  const lockHealth = () => {
    setIsHealthUnlocked(false);
  };

  const openQuickAction = () => setIsQuickActionOpen(true);
  const closeQuickAction = () => {
    setIsQuickActionOpen(false);
    setQuickActionInitialTab(null);
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        switchUser,
        isHealthUnlocked,
        unlockHealthWithPin,
        lockHealth,
        isQuickActionOpen,
        openQuickAction,
        closeQuickAction,
        quickActionInitialTab,
        setQuickActionInitialTab,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
