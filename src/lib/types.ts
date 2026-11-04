export type UserRole = 'OWNER_FADY' | 'OWNER_RAHMA' | 'MEMBER';

export interface UserSession {
  id: string;
  displayName: string;
  role: UserRole;
  avatar: string;
  householdId: string;
  isHealthUnlocked?: boolean; // Unlocked via PIN
}

export interface HouseholdSummary {
  id: string;
  name: string;
  monthlyBudgetTarget: number;
}

export interface HealthProfileData {
  id: string;
  userId: string;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
  dailyCalorieTarget: number;
  dailyWaterTargetMl: number;
  macrosProteinG: number;
  macrosCarbsG: number;
  macrosFatG: number;
  isSharedWithPartner: boolean;
  updatedAt: string;
}

export interface WeightLogItem {
  id: string;
  userId: string;
  weightKg: number;
  loggedAt: string;
  notes?: string | null;
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface WorkoutLogItem {
  id: string;
  userId: string;
  title: string;
  category: 'GYM' | 'HOME' | 'CARDIO' | 'WALKING';
  durationMins: number;
  exercises: WorkoutExercise[];
  burnedCalories: number;
  date: string;
  notes?: string | null;
}

export interface MedicalRecordItem {
  id: string;
  userId: string;
  title: string;
  testType: 'BLOOD_TEST' | 'SCAN' | 'PRESCRIPTION' | 'CHECKUP';
  testDate: string;
  filePath?: string | null;
  aiSummary?: string | null;
  isSharedWithPartner: boolean;
}

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  estimatedPrice: number;
}

export interface RecipeItem {
  id: string;
  householdId: string;
  title: string;
  category: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  imageUrl?: string | null;
  servings: number;
  prepTimeMins: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  estimatedCost: number;
  suggestedByUserId?: string | null;
  isFavoriteFady: boolean;
  isFavoriteRahma: boolean;
  dislikedByFady: boolean;
  dislikedByRahma: boolean;
}

export interface MealPlanItem {
  id: string;
  householdId: string;
  date: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  recipeId?: string | null;
  recipe?: RecipeItem | null;
  customName?: string | null;
  servings: number;
  status: 'PLANNED' | 'PREPARED' | 'SKIPPED';
  notes?: string | null;
}

export interface ShoppingListItem {
  id: string;
  householdId: string;
  name: string;
  category: 'GROCERIES' | 'CLEANING' | 'HOUSEHOLD' | 'PERSONAL' | 'PHARMACY';
  quantity: number;
  unit: string;
  inStockQty: number;
  needBuyQty: number;
  estimatedPrice: number;
  actualPrice?: number | null;
  isPurchased: boolean;
  assignedToUserId?: string | null;
  sourceRecipeId?: string | null;
  addedByVoiceOrAi: boolean;
}

export interface ExpenseItem {
  id: string;
  householdId: string;
  title: string;
  amount: number;
  category: 'FOOD' | 'HOUSEHOLD' | 'CLEANING' | 'UTILITIES' | 'FADY_PERSONAL' | 'RAHMA_PERSONAL' | 'HEALTH_GYM' | 'ENTERTAINMENT' | 'OTHER';
  expenseDate: string;
  paidByUserId: string;
  paymentMethod: 'CASH' | 'CARD' | 'INSTAPAY' | 'WALLET';
  notes?: string | null;
}

export interface InvoiceItem {
  name: string;
  qty: number;
  unitPrice: number;
  category: string;
}

export interface InvoiceReceiptItem {
  id: string;
  householdId: string;
  imagePath: string;
  storeName: string;
  invoiceDate: string;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  parsedItems: InvoiceItem[];
  status: 'DRAFT' | 'CONFIRMED';
  uploadedByUserId: string;
}

export interface PrayerRecordItem {
  id: string;
  userId: string;
  date: string;
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  morningDhikr: boolean;
  eveningDhikr: boolean;
  quranPages: number;
  encouragementNote?: string | null;
}

export interface HouseholdTaskItem {
  id: string;
  householdId: string;
  title: string;
  area: 'KITCHEN' | 'LIVING_ROOM' | 'BEDROOM' | 'BATHROOM' | 'LAUNDRY' | 'GENERAL';
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  assignedToUserId?: string | null;
  isCompleted: boolean;
  pointsReward: number;
  lastCompletedAt?: string | null;
}

export interface RewardCatalogItem {
  id: string;
  householdId: string;
  title: string;
  description?: string | null;
  pointsCost: number;
  icon: string;
  isActive: boolean;
}

export interface AIChatMessageItem {
  id: string;
  userId?: string | null;
  persona: 'om_mahmoud' | 'fady_coach' | 'family_assistant';
  role: 'user' | 'assistant' | 'system';
  content: string;
  mediaUrl?: string | null;
  createdAt: string;
}
