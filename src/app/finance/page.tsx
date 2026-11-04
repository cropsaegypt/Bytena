'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { formatArabicDate, formatCurrency } from '@/lib/date-utils';
import { 
  Wallet, 
  Plus, 
  Camera, 
  PieChart as PieIcon, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ShoppingBag,
  Sparkles,
  X,
  CreditCard,
  Banknote,
  Smartphone
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip 
} from 'recharts';

const CATEGORY_NAMES: Record<string, { label: string; color: string }> = {
  FOOD: { label: 'الطعام والمطبخ', color: '#e11d48' },
  HOUSEHOLD: { label: 'احتياجات المنزل', color: '#f59e0b' },
  CLEANING: { label: 'المنظفات', color: '#10b981' },
  UTILITIES: { label: 'فواتير وخدمات', color: '#3b82f6' },
  FADY_PERSONAL: { label: 'مصروفات فادي', color: '#6366f1' },
  RAHMA_PERSONAL: { label: 'مصروفات رحمة', color: '#ec4899' },
  HEALTH_GYM: { label: 'الصحة والجيم', color: '#14b8a6' },
  ENTERTAINMENT: { label: 'خروجات وترفيه', color: '#8b5cf6' },
  OTHER: { label: 'أخرى', color: '#6b7280' },
};

export default function FinancePage() {
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isInvoiceScannerOpen, setIsInvoiceScannerOpen] = useState(false);
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  
  // New Expense form
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('FOOD');
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [paidByUserId, setPaidByUserId] = useState(currentUser.id);
  const [notes, setNotes] = useState('');

  // Invoice Scanner state
  const [scanning, setScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<any | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Edit Budget state
  const [newBudgetTarget, setNewBudgetTarget] = useState('');

  const fetchFinance = async () => {
    try {
      const res = await fetch('/api/finance');
      const json = await res.json();
      if (json.success) {
        setData(json);
        setNewBudgetTarget(String(json.budget));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Add Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_expense',
          title,
          amount,
          category,
          paidByUserId,
          paymentMethod,
          notes,
        }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        showNotification('تم تسجيل المصروف بنجاح 💸');
        setIsAddExpenseOpen(false);
        setTitle('');
        setAmount('');
        fetchFinance();
      }
    } catch (e) {
      alert('حدث خطأ');
    }
  };

  // Trigger AI Invoice Scan (Simulated / Vision OCR)
  const handleScanInvoice = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setScanning(true);

    try {
      let base64String = '';
      if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        await new Promise((resolve) => {
          reader.onload = () => {
            base64String = reader.result as string;
            resolve(true);
          };
        });
      }

      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scan_invoice',
          imageBase64: base64String,
          userId: currentUser.id,
        }),
      });

      const resJson = await res.json();
      if (resJson.success) {
        setScannedResult(resJson);
      }
    } catch (e) {
      alert('خطأ أثناء قراءة الفاتورة');
    } finally {
      setScanning(false);
    }
  };

  // Confirm Invoice
  const handleConfirmInvoice = async () => {
    if (!scannedResult) return;

    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_invoice',
          invoiceId: scannedResult.invoice.id,
          approvedAmount: scannedResult.parsed.totalAmount,
          approvedCategory: 'FOOD',
          approvedTitle: `فاتورة ${scannedResult.parsed.storeName}`,
          markShoppingItemsPurchased: true,
          userId: currentUser.id,
        }),
      });

      const resJson = await res.json();
      if (resJson.success) {
        showNotification('تم اعتماد الفاتورة وتسجيل المصروف وتحديث طلبات البيت! 🎉');
        setIsInvoiceScannerOpen(false);
        setScannedResult(null);
        fetchFinance();
      }
    } catch (e) {
      alert('خطأ أثناء تأكيد الفاتورة');
    }
  };

  // Update Budget
  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetTarget) return;

    try {
      await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_budget',
          monthlyBudgetTarget: newBudgetTarget,
        }),
      });
      showNotification('تم تحديث الميزانية الشهرية بنجاح 🎯');
      setIsEditBudgetOpen(false);
      fetchFinance();
    } catch (e) {
      alert('حدث خطأ');
    }
  };

  if (loading || !data) {
    return (
      <div className="py-20 text-center text-xs text-neutral-500 font-bold">
        جاري مراجعة ميزانية البيت... 💰
      </div>
    );
  }

  // Prepare chart data
  const chartData = Object.entries(data.categoryTotals || {}).map(([key, value]) => ({
    name: CATEGORY_NAMES[key]?.label || key,
    value: Number(value) || 0,
    color: CATEGORY_NAMES[key]?.color || '#6b7280',
  }));

  const budgetUsagePercent = Math.min(100, Math.round((data.totalSpent / data.budget) * 100));

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-neutral-800 flex items-center gap-2">
            <span>فلوس بيتنا</span>
            <Wallet className="w-5 h-5 text-brand-600" />
          </h1>
          <p className="text-xs text-neutral-500">ميزانية الأسرة، المصروفات، وماسح الفواتير بالذكاء الاصطناعي</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsInvoiceScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            title="تصوير فاتورة"
          >
            <Camera className="w-4 h-4" />
            <span>ماسح الفاتورة</span>
          </button>

          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>مصروف</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold text-center animate-slideDown">
          {notification}
        </div>
      )}

      {/* Budget Card */}
      <div className="bg-gradient-to-l from-neutral-900 to-neutral-800 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 bg-white/10 px-2 py-0.5 rounded-full">
              ميزانية الشهر
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-emerald-400 tracking-tight">
                {formatCurrency(data.remaining)}
              </span>
              <span className="text-xs text-neutral-400">متبقي بأمان</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              تم صرف: <span className="text-white font-bold">{formatCurrency(data.totalSpent)}</span> من أصل <span className="text-white font-bold">{formatCurrency(data.budget)}</span>
            </p>
          </div>

          <button
            onClick={() => setIsEditBudgetOpen(true)}
            className="text-xs bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-xl text-neutral-200 font-bold transition-colors"
          >
            تعديل الميزانية ✏️
          </button>
        </div>

        {/* Usage Bar */}
        <div className="mt-4">
          <div className="w-full h-2.5 bg-neutral-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetUsagePercent > 85 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${budgetUsagePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-neutral-400 mt-1.5">
            <span>استهلاك {budgetUsagePercent}%</span>
            <span>المعدل الموصى به: حتى 80%</span>
          </div>
        </div>
      </div>

      {/* Spending Breakdown Chart */}
      {chartData.length > 0 && (
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-1.5">
            <PieIcon className="w-4 h-4 text-brand-600" />
            <h3 className="text-xs font-extrabold text-neutral-800">توزيع المصروفات حسب التصنيف</h3>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(val: any) => formatCurrency(val)}
                  contentStyle={{ borderRadius: '12px', fontSize: '11px', direction: 'rtl' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 text-xs">
            {chartData.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-neutral-600 text-[11px] truncate">{entry.name}</span>
                </div>
                <span className="font-extrabold text-neutral-800 text-[11px]">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Expenses List */}
      <div className="space-y-2">
        <h2 className="text-xs font-extrabold text-neutral-700 px-1">سجل المصروفات الأخير</h2>

        <div className="space-y-2">
          {data.expenses.map((exp: any) => {
            const cat = CATEGORY_NAMES[exp.category] || { label: 'أخرى', color: '#6b7280' };

            return (
              <div
                key={exp.id}
                className="p-3.5 bg-white border border-neutral-200/80 rounded-2xl flex items-center justify-between shadow-sm hover:border-neutral-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: cat.color }}
                  >
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-neutral-800">{exp.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-500">
                      <span>{cat.label}</span>
                      <span>•</span>
                      <span>{new Date(exp.expenseDate).toLocaleDateString('ar-EG')}</span>
                      <span>•</span>
                      <span className="font-bold text-neutral-700">دفع: {exp.paidBy?.displayName || 'البيت'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-left">
                  <span className="font-black text-sm text-rose-600">
                    -{formatCurrency(exp.amount)}
                  </span>
                  <span className="block text-[10px] text-neutral-400 font-medium">
                    {exp.paymentMethod === 'CARD' ? 'بطاقة بنكية' : exp.paymentMethod === 'INSTAPAY' ? 'إنستاباي' : 'نقداً'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: ADD EXPENSE */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleAddExpense}
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-sm text-neutral-800">تسجيل مصروف جديد 💸</h3>
              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">البيان</label>
              <input
                type="text"
                required
                placeholder="مثال: فاتورة كارفور، بنزين، كافيه..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">المبلغ (ج.م)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm font-extrabold text-center text-rose-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">طريقة الدفع</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 text-xs font-bold"
                >
                  <option value="CARD">بطاقة بنكية 💳</option>
                  <option value="INSTAPAY">إنستاباي 📱</option>
                  <option value="CASH">كاش نقدي 💵</option>
                  <option value="WALLET">محفظة إلكترونية 💼</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">التصنيف</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 text-xs"
                >
                  <option value="FOOD">الطعام والمطبخ</option>
                  <option value="HOUSEHOLD">احتياجات المنزل</option>
                  <option value="CLEANING">المنظفات</option>
                  <option value="UTILITIES">فواتير البيت</option>
                  <option value="HEALTH_GYM">الصحة والجيم</option>
                  <option value="ENTERTAINMENT">ترفيه وخروجات</option>
                  <option value="FADY_PERSONAL">مصروف فادي</option>
                  <option value="RAHMA_PERSONAL">مصروف رحمة</option>
                  <option value="OTHER">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">مين دفع؟</label>
                <select
                  value={paidByUserId}
                  onChange={(e) => setPaidByUserId(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 text-xs font-bold"
                >
                  <option value="fady">فادي 👨🏻‍💻</option>
                  <option value="rahma">رحمة 👩🏻‍🍳</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
              >
                تسجيل المصروف 💸
              </button>
              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(false)}
                className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: AI INVOICE SCANNER */}
      {isInvoiceScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-sm text-neutral-800">ماسح الفواتير بالذكاء الاصطناعي</h3>
              </div>
              <button
                onClick={() => {
                  setIsInvoiceScannerOpen(false);
                  setScannedResult(null);
                }}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500"
              >
                ✕
              </button>
            </div>

            {!scannedResult ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-neutral-800">صوّر أو ارفع صورة الفاتورة</h4>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    سيقوم الذكاء الاصطناعي بقراءة المنتجات والأسعار، ومطابقتها مع نواقص البيت، ولن يُسجل أي مصروف إلا بعد موافقتك.
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-lg shadow-amber-500/25 cursor-pointer transition-all active:scale-95">
                  <Camera className="w-4 h-4" />
                  <span>{scanning ? 'جاري الفحص بالذكاء الاصطناعي...' : 'التقاط صورة الفاتورة 📸'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleScanInvoice}
                    disabled={scanning}
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-700 font-bold">المتجر والتاريخ</span>
                    <h4 className="font-extrabold text-sm text-neutral-800">
                      {scannedResult.parsed.storeName}
                    </h4>
                    <span className="text-xs text-neutral-500">{scannedResult.parsed.invoiceDate}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-amber-700 font-bold">الإجمالي المقروء</span>
                    <p className="text-base font-black text-rose-600">
                      {formatCurrency(scannedResult.parsed.totalAmount)}
                    </p>
                  </div>
                </div>

                {/* Parsed Items List */}
                <div>
                  <h5 className="text-xs font-extrabold text-neutral-700 mb-1.5">الأصناف المستخرجة:</h5>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {scannedResult.parsed.items?.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="p-2 bg-neutral-50 border border-neutral-100 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-neutral-800">{item.name}</p>
                          <span className="text-[10px] text-neutral-500">
                            الكمية: {item.qty} • سعر الوحدة: {item.unitPrice} ج.م
                          </span>
                        </div>
                        <span className="font-extrabold text-neutral-700">
                          {item.qty * item.unitPrice} ج.م
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 bg-emerald-50 rounded-xl text-[11px] text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>سيتم شطب الأصناف المتطابقة من قائمة طلبات البيت تلقائياً</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleConfirmInvoice}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
                  >
                    اعتماد وتسجيل الفاتورة 💸
                  </button>
                  <button
                    onClick={() => setScannedResult(null)}
                    className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold text-xs"
                  >
                    إعادة الفحص
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT BUDGET */}
      {isEditBudgetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleUpdateBudget}
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-sm text-neutral-800">تعديل ميزانية المنزل الشهرية 🎯</h3>
              <button
                type="button"
                onClick={() => setIsEditBudgetOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">الميزانية المستهدفة (ج.م)</label>
              <input
                type="number"
                required
                value={newBudgetTarget}
                onChange={(e) => setNewBudgetTarget(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-base font-black text-center text-neutral-800 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
              >
                حفظ الميزانية
              </button>
              <button
                type="button"
                onClick={() => setIsEditBudgetOpen(false)}
                className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
