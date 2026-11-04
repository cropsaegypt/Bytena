'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { 
  X, 
  Wallet, 
  Camera, 
  Utensils, 
  Scale, 
  Dumbbell, 
  ShoppingCart, 
  Sparkles,
  CheckCircle2,
  Droplet
} from 'lucide-react';

export default function QuickActionModal() {
  const router = useRouter();
  const { isQuickActionOpen, closeQuickAction, currentUser } = useUser();
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('FOOD');

  const [shoppingName, setShoppingName] = useState('');
  const [shoppingCategory, setShoppingCategory] = useState('GROCERIES');

  const [weightKg, setWeightKg] = useState('');

  if (!isQuickActionOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
      closeQuickAction();
      setActiveForm(null);
    }, 1200);
  };

  // Submit Fast Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return;
    setLoading(true);
    try {
      await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_expense',
          title: expenseTitle,
          amount: expenseAmount,
          category: expenseCategory,
          paidByUserId: currentUser.id,
        }),
      });
      showToast('تم تسجيل المصروف بنجاح 💸');
    } catch {
      setLoading(false);
    }
  };

  // Submit Fast Shopping Item
  const handleAddShopping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shoppingName) return;
    setLoading(true);
    try {
      await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_item',
          name: shoppingName,
          category: shoppingCategory,
          quantity: 1,
          assignedToUserId: currentUser.id,
        }),
      });
      showToast('تمت إضافة الغرض لطلبات البيت 🛒');
    } catch {
      setLoading(false);
    }
  };

  // Submit Fast Weight
  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightKg) return;
    setLoading(true);
    try {
      await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_weight',
          userId: currentUser.id,
          weightKg,
        }),
      });
      showToast('عاش يا بطل! تم تسجيل الوزن ⚖️');
    } catch {
      setLoading(false);
    }
  };

  // Fast Water Log
  const handleQuickWater = async () => {
    setLoading(true);
    try {
      await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_water',
          userId: currentUser.id,
          amountMl: 250,
        }),
      });
      showToast('بالهنا والشفا! تم تسجيل كوب مية (250 مل) 💧');
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-all animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-neutral-100 animate-slideUp">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/60">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h3 className="font-extrabold text-neutral-800 text-base">
              {activeForm ? 'تسجيل سريع' : 'إجراء سريع في بيتنا'}
            </h3>
          </div>
          <button
            onClick={closeQuickAction}
            className="w-8 h-8 rounded-full bg-neutral-200/60 hover:bg-neutral-300 flex items-center justify-center text-neutral-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Toast */}
        {toastMessage && (
          <div className="p-6 text-center flex flex-col items-center justify-center gap-2 animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <p className="font-bold text-neutral-800 text-base">{toastMessage}</p>
          </div>
        )}

        {/* Content */}
        {!toastMessage && !activeForm && (
          <div className="p-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => setActiveForm('expense')}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-50/80 hover:bg-rose-100 text-brand-700 font-bold text-sm transition-all text-right border border-rose-100 active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p>إضافة مصروف</p>
                <span className="text-[10px] text-brand-600/80 font-normal">تسجيل فوري</span>
              </div>
            </button>

            <button
              onClick={() => {
                closeQuickAction();
                router.push('/finance?tab=invoice');
              }}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50/80 hover:bg-amber-100 text-amber-800 font-bold text-sm transition-all text-right border border-amber-100 active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <p>تصوير فاتورة</p>
                <span className="text-[10px] text-amber-700/80 font-normal">بالذكاء الاصطناعي</span>
              </div>
            </button>

            <button
              onClick={() => setActiveForm('shopping')}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 font-bold text-sm transition-all text-right border border-emerald-100 active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <p>طلب للبيت</p>
                <span className="text-[10px] text-emerald-700/80 font-normal">للقائمة المشتركة</span>
              </div>
            </button>

            <button
              onClick={() => setActiveForm('weight')}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50/80 hover:bg-blue-100 text-blue-800 font-bold text-sm transition-all text-right border border-blue-100 active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <p>تسجيل وزن</p>
                <span className="text-[10px] text-blue-700/80 font-normal">الملف الخاص</span>
              </div>
            </button>

            <button
              onClick={handleQuickWater}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-cyan-50/80 hover:bg-cyan-100 text-cyan-800 font-bold text-sm transition-all text-right border border-cyan-100 active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500 text-white flex items-center justify-center shadow-md shadow-cyan-500/20">
                <Droplet className="w-5 h-5" />
              </div>
              <div>
                <p>شربت مية</p>
                <span className="text-[10px] text-cyan-700/80 font-normal">+250 مل فوري</span>
              </div>
            </button>

            <button
              onClick={() => {
                closeQuickAction();
                router.push('/assistant');
              }}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-purple-50/80 hover:bg-purple-100 text-purple-800 font-bold text-sm transition-all text-right border border-purple-100 active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p>أم محمود</p>
                <span className="text-[10px] text-purple-700/80 font-normal">دردشة وروقان</span>
              </div>
            </button>
          </div>
        )}

        {/* Subform: Expense */}
        {!toastMessage && activeForm === 'expense' && (
          <form onSubmit={handleAddExpense} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-600 mb-1">بيان المصروف</label>
              <input
                type="text"
                required
                placeholder="مثال: غدا من كوشري التحرير، بقالة..."
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1">المبلغ (ج.م)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1">التصنيف</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="FOOD">الطعام والمطبخ</option>
                  <option value="HOUSEHOLD">احتياجات المنزل</option>
                  <option value="CLEANING">المنظفات</option>
                  <option value="UTILITIES">فواتير البيت</option>
                  <option value="HEALTH_GYM">الصحة والجيم</option>
                  <option value="ENTERTAINMENT">ترفيه وخروجات</option>
                  <option value="OTHER">أخرى</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'جاري الحفظ...' : 'تسجيل المصروف 💸'}
              </button>
              <button
                type="button"
                onClick={() => setActiveForm(null)}
                className="px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold text-sm"
              >
                رجوع
              </button>
            </div>
          </form>
        )}

        {/* Subform: Shopping */}
        {!toastMessage && activeForm === 'shopping' && (
          <form onSubmit={handleAddShopping} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-600 mb-1">اسم الغرض أو السلعة</label>
              <input
                type="text"
                required
                placeholder="مثال: كيلو موز، جبنة رومي، صابون..."
                value={shoppingName}
                onChange={(e) => setShoppingName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-600 mb-1">التصنيف</label>
              <select
                value={shoppingCategory}
                onChange={(e) => setShoppingCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="GROCERIES">خضار ومأكولات وسوبرماركت</option>
                <option value="CLEANING">منظفات ومستلزمات الغسيل</option>
                <option value="HOUSEHOLD">أدوات واحتياجات المنزل</option>
                <option value="PHARMACY">أدوية وصيدلية</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'جاري الحفظ...' : 'إضافة للطلبات 🛒'}
              </button>
              <button
                type="button"
                onClick={() => setActiveForm(null)}
                className="px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold text-sm"
              >
                رجوع
              </button>
            </div>
          </form>
        )}

        {/* Subform: Weight */}
        {!toastMessage && activeForm === 'weight' && (
          <form onSubmit={handleAddWeight} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-600 mb-1">الوزن الحالي (كجم)</label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="مثال: 85.5"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-extrabold text-lg text-center"
              />
              <p className="text-[11px] text-neutral-500 mt-1 text-center">يفضل القياس صباحاً على الريق بعد الاستيقاظ مباشرة</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'جاري الحفظ...' : 'تسجيل الوزن ⚖️'}
              </button>
              <button
                type="button"
                onClick={() => setActiveForm(null)}
                className="px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold text-sm"
              >
                رجوع
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
