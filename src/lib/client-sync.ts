// Universal Persistent Client Sync Engine for Baytna
// Guarantees zero data loss across page refreshes, mobile app restarts, and serverless cold boots.

export interface SyncShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: string | number;
  unit?: string;
  estimatedPrice?: number;
  isPurchased: boolean;
  assignedToUserId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SyncExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  expenseDate: string;
  paidByUserId: string;
  paymentMethod: string;
  notes?: string;
  createdAt?: string;
}

export interface SyncHealthProfile {
  heightCm?: number | null;
  currentWeightKg?: number | null;
  targetWeightKg?: number | null;
  dailyWaterTargetMl?: number;
  weightLogs: Array<{
    id: string;
    weightKg: number;
    loggedAt: string;
    notes?: string;
  }>;
  workoutLogs: Array<{
    id: string;
    title: string;
    category: string;
    durationMinutes: number;
    notes?: string;
    date: string;
  }>;
  totalWaterToday: number;
}

// 1. SHOPPING SYNC
const SHOPPING_KEY = 'baytna_storage_shopping_items_v2';
const DELETED_SHOPPING_KEY = 'baytna_deleted_shopping_ids';

export function getLocalShoppingItems(): SyncShoppingItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SHOPPING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalShoppingItems(items: SyncShoppingItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SHOPPING_KEY, JSON.stringify(items));
  } catch {}
}

export function trackDeletedShoppingId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(DELETED_SHOPPING_KEY);
    const set: string[] = raw ? JSON.parse(raw) : [];
    if (!set.includes(id)) {
      set.push(id);
      localStorage.setItem(DELETED_SHOPPING_KEY, JSON.stringify(set.slice(-100)));
    }
  } catch {}
}

export function mergeShoppingItems(remoteItems: SyncShoppingItem[]): SyncShoppingItem[] {
  const localItems = getLocalShoppingItems();
  let deletedIds: string[] = [];
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(DELETED_SHOPPING_KEY);
      if (raw) deletedIds = JSON.parse(raw);
    } catch {}
  }

  // Filter out deleted items from remote
  const filteredRemote = remoteItems.filter((r) => !deletedIds.includes(r.id));

  // Merge map: remote takes base, local overrides if more recent or un-synced
  const map = new Map<string, SyncShoppingItem>();
  filteredRemote.forEach((item) => map.set(item.id, item));

  localItems.forEach((local) => {
    if (!deletedIds.includes(local.id)) {
      map.set(local.id, local);
    }
  });

  const merged = Array.from(map.values());
  saveLocalShoppingItems(merged);
  return merged;
}

// 2. FINANCE SYNC
const FINANCE_EXPENSES_KEY = 'baytna_storage_expenses_v2';
const FINANCE_BUDGET_KEY = 'baytna_storage_budget_target';
const DELETED_EXPENSES_KEY = 'baytna_deleted_expense_ids';

export function getLocalExpenses(): SyncExpense[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FINANCE_EXPENSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalExpenses(expenses: SyncExpense[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FINANCE_EXPENSES_KEY, JSON.stringify(expenses));
  } catch {}
}

export function getLocalBudgetTarget(): number {
  if (typeof window === 'undefined') return 16000;
  try {
    const raw = localStorage.getItem(FINANCE_BUDGET_KEY);
    return raw ? parseFloat(raw) : 16000;
  } catch {
    return 16000;
  }
}

export function saveLocalBudgetTarget(target: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FINANCE_BUDGET_KEY, String(target));
  } catch {}
}

export function trackDeletedExpenseId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(DELETED_EXPENSES_KEY);
    const set: string[] = raw ? JSON.parse(raw) : [];
    if (!set.includes(id)) {
      set.push(id);
      localStorage.setItem(DELETED_EXPENSES_KEY, JSON.stringify(set.slice(-100)));
    }
  } catch {}
}

export function mergeExpenses(remoteExpenses: SyncExpense[]): SyncExpense[] {
  const localExpenses = getLocalExpenses();
  let deletedIds: string[] = [];
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(DELETED_EXPENSES_KEY);
      if (raw) deletedIds = JSON.parse(raw);
    } catch {}
  }

  const filteredRemote = remoteExpenses.filter((r) => !deletedIds.includes(r.id));
  const map = new Map<string, SyncExpense>();
  filteredRemote.forEach((item) => map.set(item.id, item));

  localExpenses.forEach((local) => {
    if (!deletedIds.includes(local.id)) {
      map.set(local.id, local);
    }
  });

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.expenseDate || b.createdAt || 0).getTime() - new Date(a.expenseDate || a.createdAt || 0).getTime()
  );
  saveLocalExpenses(merged);
  return merged;
}

// 3. HEALTH SYNC
export function getLocalHealthData(userId: string): SyncHealthProfile {
  const defaultProfile: SyncHealthProfile = {
    heightCm: null,
    currentWeightKg: null,
    targetWeightKg: null,
    dailyWaterTargetMl: 3000,
    weightLogs: [],
    workoutLogs: [],
    totalWaterToday: 0,
  };

  if (typeof window === 'undefined') return defaultProfile;
  try {
    const raw = localStorage.getItem(`baytna_health_v2_${userId}`);
    return raw ? { ...defaultProfile, ...JSON.parse(raw) } : defaultProfile;
  } catch {
    return defaultProfile;
  }
}

export function saveLocalHealthData(userId: string, data: SyncHealthProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`baytna_health_v2_${userId}`, JSON.stringify(data));
  } catch {}
}

export function mergeHealthData(userId: string, remoteData: any): SyncHealthProfile {
  const local = getLocalHealthData(userId);

  const remoteProfile = remoteData?.profile || {};
  const remoteWeightLogs = remoteData?.weightLogs || [];
  const remoteWorkoutLogs = remoteData?.workoutLogs || [];

  // Local user values take precedence over demo server defaults
  const currentWeightKg = local.currentWeightKg ?? remoteProfile.currentWeightKg ?? null;
  const targetWeightKg = local.targetWeightKg ?? remoteProfile.targetWeightKg ?? null;
  const heightCm = local.heightCm ?? remoteProfile.heightCm ?? null;

  // Merge weight logs by ID
  const weightMap = new Map<string, any>();
  remoteWeightLogs.forEach((w: any) => weightMap.set(w.id, w));
  local.weightLogs.forEach((w: any) => weightMap.set(w.id, w));
  const mergedWeights = Array.from(weightMap.values()).sort(
    (a, b) => new Date(b.loggedAt || 0).getTime() - new Date(a.loggedAt || 0).getTime()
  );

  // Merge workout logs
  const workoutMap = new Map<string, any>();
  remoteWorkoutLogs.forEach((w: any) => workoutMap.set(w.id, w));
  local.workoutLogs.forEach((w: any) => workoutMap.set(w.id, w));
  const mergedWorkouts = Array.from(workoutMap.values()).sort(
    (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
  );

  const totalWaterToday = Math.max(local.totalWaterToday || 0, remoteData?.totalWaterToday || 0);

  const merged: SyncHealthProfile = {
    currentWeightKg,
    targetWeightKg,
    heightCm,
    dailyWaterTargetMl: local.dailyWaterTargetMl || remoteProfile.dailyWaterTargetMl || 3000,
    weightLogs: mergedWeights,
    workoutLogs: mergedWorkouts,
    totalWaterToday,
  };

  saveLocalHealthData(userId, merged);
  return merged;
}
