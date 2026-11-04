'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { 
  ShoppingCart, 
  Plus, 
  Mic, 
  MicOff, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Filter, 
  Search,
  User,
  PackageCheck,
  Tag
} from 'lucide-react';

export default function ShoppingPage() {
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  
  // Add item form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('GROCERIES');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('قطعة');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [assignedToUserId, setAssignedToUserId] = useState(currentUser.id);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/shopping');
      const json = await res.json();
      if (json.success) {
        setItems(json.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Web Speech API for Arabic voice input
  const handleToggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('التعرف الصوتي غير مدعوم في هذا المتصفح حالياً. يمكنك الكتابة مباشرة.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-EG'; // Egyptian Arabic
    recognition.continuous = false;
    recognition.interimResults = false;

    if (!isListening) {
      recognition.start();
      setIsListening(true);

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setName(text);
        setIsAddOpen(true);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else {
      recognition.stop();
      setIsListening(false);
    }
  };

  // Toggle purchased
  const handleTogglePurchase = async (id: string, currentStatus: boolean) => {
    try {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isPurchased: !currentStatus } : item))
      );

      await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_purchase',
          id,
          isPurchased: !currentStatus,
          purchasedByUserId: currentUser.id,
        }),
      });
    } catch (e) {
      fetchItems();
    }
  };

  // Delete item
  const handleDeleteItem = async (id: string) => {
    try {
      setItems((prev) => prev.filter((item) => item.id !== id));
      await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_item', id }),
      });
    } catch (e) {
      fetchItems();
    }
  };

  // Add Item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const res = await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_item',
          name,
          category,
          quantity,
          unit,
          estimatedPrice,
          assignedToUserId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setName('');
        setEstimatedPrice('');
        setIsAddOpen(false);
        fetchItems();
      }
    } catch (e) {
      alert('خطأ أثناء الإضافة');
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const pendingItems = filteredItems.filter((i) => !i.isPurchased);
  const purchasedItems = filteredItems.filter((i) => i.isPurchased);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-neutral-500 font-bold">
        جاري تحميل طلبات البيت... 🛒
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-neutral-800 flex items-center gap-2">
            <span>طلبات البيت</span>
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
          </h1>
          <p className="text-xs text-neutral-500">القائمة المشتركة للمشتريات والنواقص</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Voice Input Button */}
          <button
            onClick={handleToggleVoice}
            className={`p-2.5 rounded-2xl border transition-all ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse border-rose-600'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200'
            }`}
            title="إملاء صوتي باللهجة المصرية"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة غرض</span>
          </button>
        </div>
      </div>

      {/* Voice Status Alert */}
      {isListening && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-brand-700 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          اتكلم يا {currentUser.displayName}، سامعك وبسجل اسم الغرض...
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-neutral-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث في الطلبات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-2 rounded-2xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="py-2 px-3 rounded-2xl border border-neutral-200 text-xs bg-white font-bold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="ALL">كل التصنيفات</option>
          <option value="GROCERIES">المطبخ والأكل</option>
          <option value="CLEANING">المنظفات والغسيل</option>
          <option value="HOUSEHOLD">احتياجات المنزل</option>
          <option value="PHARMACY">الصيدلية والأدوية</option>
        </select>
      </div>

      {/* Pending Items Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-extrabold text-neutral-700">
            مطلوب شراؤه ({pendingItems.length})
          </h2>
          <span className="text-[11px] text-neutral-400">اضغط للاعتماد والإنجاز</span>
        </div>

        {pendingItems.length === 0 ? (
          <div className="p-6 bg-white border border-neutral-200/80 rounded-2xl text-center">
            <PackageCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-neutral-800">كل الطلبات تم شراؤها أو القائمة فارغة!</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">البيت عامر بكل الخير ❤️</p>
          </div>
        ) : (
          pendingItems.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-white border border-neutral-200/80 rounded-2xl flex items-center justify-between hover:border-emerald-300 transition-all shadow-sm"
            >
              <div
                onClick={() => handleTogglePurchase(item.id, false)}
                className="flex items-center gap-3 cursor-pointer flex-1"
              >
                <Circle className="w-5 h-5 text-neutral-300 hover:text-emerald-500 transition-colors shrink-0" />
                <div>
                  <h3 className="font-extrabold text-sm text-neutral-800">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-500">
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {item.needBuyQty} {item.unit}
                    </span>
                    {item.estimatedPrice > 0 && (
                      <span>تقريباً: {item.estimatedPrice} ج.م</span>
                    )}
                    {item.assignedToUserId && (
                      <span className="flex items-center gap-0.5 text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                        <User className="w-2.5 h-2.5" />
                        {item.assignedToUserId === 'fady' ? 'فادي' : 'رحمة'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDeleteItem(item.id)}
                className="p-2 text-neutral-300 hover:text-rose-500 transition-colors"
                title="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Purchased Items Accordion */}
      {purchasedItems.length > 0 && (
        <div className="space-y-2 pt-2">
          <h2 className="text-xs font-bold text-neutral-400 px-1">
            تم شراؤه مؤخراً ({purchasedItems.length})
          </h2>

          <div className="space-y-1.5 opacity-65">
            {purchasedItems.map((item) => (
              <div
                key={item.id}
                className="p-2.5 bg-neutral-50 border border-neutral-200/50 rounded-xl flex items-center justify-between"
              >
                <div
                  onClick={() => handleTogglePurchase(item.id, true)}
                  className="flex items-center gap-2.5 cursor-pointer flex-1"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs text-neutral-500 font-medium line-through">
                    {item.name} ({item.quantity} {item.unit})
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1 text-neutral-300 hover:text-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleAddItem}
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-sm text-neutral-800">إضافة غرض لقائمة البيت 🛒</h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">اسم المنتج</label>
              <input
                type="text"
                required
                placeholder="مثال: زيت زيتون بكر، مناديل مطبخ..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">الكمية</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">الوحدة</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-bold"
                >
                  <option value="قطعة">قطعة / حبة</option>
                  <option value="كجم">كيلوجرام (كجم)</option>
                  <option value="لتر">لتر</option>
                  <option value="كيس">كيس / عبوة</option>
                  <option value="علبة">علبة</option>
                  <option value="باكيت">باكيت</option>
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
                  <option value="GROCERIES">المطبخ والأكل</option>
                  <option value="CLEANING">منظفات وغسيل</option>
                  <option value="HOUSEHOLD">احتياجات البيت</option>
                  <option value="PHARMACY">الصيدلية</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">المسؤول عن الشراء</label>
                <select
                  value={assignedToUserId}
                  onChange={(e) => setAssignedToUserId(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 text-xs"
                >
                  <option value="fady">فادي 👨🏻‍💻</option>
                  <option value="rahma">رحمة 👩🏻‍🍳</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">السعر التقديري (اختياري)</label>
              <input
                type="number"
                placeholder="0.00 ج.م"
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
              >
                إضافة للطلبات 🛒
              </button>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
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
