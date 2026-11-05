'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import FinanceShoppingTabs from '@/components/Navigation/FinanceShoppingTabs';
import { triggerLoveNotification } from '@/lib/love-notifications';
import { 
  getLocalShoppingItems, 
  saveLocalShoppingItems, 
  mergeShoppingItems, 
  trackDeletedShoppingId 
} from '@/lib/client-sync';
import { 
  ShoppingCart, 
  Plus, 
  Mic, 
  MicOff, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit3,
  Search,
  User,
  PackageCheck
} from 'lucide-react';

export default function ShoppingPage() {
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(false);
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

  // Edit item state
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('GROCERIES');
  const [editQuantity, setEditQuantity] = useState('1');
  const [editUnit, setEditUnit] = useState('قطعة');
  const [editPrice, setEditPrice] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('fady');

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/shopping');
      const json = await res.json();
      if (json.success && json.items) {
        const merged = mergeShoppingItems(json.items);
        setItems(merged);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const local = getLocalShoppingItems();
    if (local && local.length > 0) {
      setItems(local);
    }
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
    recognition.lang = 'ar-EG';
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

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } else {
      recognition.stop();
      setIsListening(false);
    }
  };

  // Add Item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_item',
          name: name.trim(),
          category,
          quantity,
          unit,
          estimatedPrice,
          assignedToUserId,
          addedByVoiceOrAi: isListening,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setItems((prev) => {
          const updated = [json.item, ...prev];
          saveLocalShoppingItems(updated);
          return updated;
        });
        setIsAddOpen(false);
        setName('');
        setQuantity('1');
        setEstimatedPrice('');
      }
    } catch (e) {
      alert('حدث خطأ أثناء إضافة الغرض');
    }
  };

  // Open Edit Modal
  const openEditModal = (item: any) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategory(item.category || 'GROCERIES');
    setEditQuantity(String(item.needBuyQty || item.quantity || 1));
    setEditUnit(item.unit || 'قطعة');
    setEditPrice(item.estimatedPrice ? String(item.estimatedPrice) : '');
    setEditAssignedTo(item.assignedToUserId || currentUser.id);
  };

  // Save Edited Item
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editName.trim()) return;

    try {
      const res = await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit_item',
          id: editingItem.id,
          name: editName.trim(),
          category: editCategory,
          quantity: editQuantity,
          unit: editUnit,
          estimatedPrice: editPrice,
          assignedToUserId: editAssignedTo,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setItems((prev) => {
          const updated = prev.map((it) => (it.id === editingItem.id ? json.item : it));
          saveLocalShoppingItems(updated);
          return updated;
        });
        setEditingItem(null);
      }
    } catch (e) {
      alert('حدث خطأ أثناء تعديل الغرض');
    }
  };

  // Toggle purchased state
  const handleTogglePurchase = async (itemId: string, currentStatus: boolean) => {
    const targetItem = items.find((i) => i.id === itemId);
    const newStatus = !currentStatus;

    // Optimistic Update & Local Persistence
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === itemId ? { ...item, isPurchased: newStatus } : item
      );
      saveLocalShoppingItems(updated);
      return updated;
    });

    // If marked as bought, notify partner!
    if (newStatus && targetItem) {
      triggerLoveNotification({
        type: 'SHOPPING_DONE',
        fromUserId: currentUser.id === 'fady' ? 'fady' : 'rahma',
        toUserId: currentUser.id === 'fady' ? 'rahma' : 'fady',
        title: `اشتريت طلب من البيت! 🛍️✨`,
        body: `${currentUser.displayName} اشترى "${targetItem.name}" وقفل الطلب من القائمة بكل حب ❤️`,
      });
    }

    try {
      await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_purchase',
          id: itemId,
          isPurchased: newStatus,
          purchasedByUserId: currentUser.id,
        }),
      });
    } catch (e) {
      fetchItems();
    }
  };

  // Delete Item
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('هل تريد حذف هذا الغرض من القائمة؟')) return;

    trackDeletedShoppingId(itemId);
    setItems((prev) => {
      const updated = prev.filter((i) => i.id !== itemId);
      saveLocalShoppingItems(updated);
      return updated;
    });

    try {
      await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_item',
          id: itemId,
        }),
      });
    } catch (e) {
      fetchItems();
    }
  };

  // Filtering
  const filteredItems = items.filter((item) => {
    const matchesCategory =
      categoryFilter === 'ALL' || item.category === categoryFilter;
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
    <div className="space-y-4 pb-12 animate-fadeIn w-full max-w-full">
      {/* Segmented Switcher for Shopping & Finance */}
      <FinanceShoppingTabs />
      
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
            النواقص المطلوب شراؤها ({pendingItems.length})
          </h2>
          {pendingItems.length > 0 && (
            <span className="text-[11px] text-neutral-400">
              إجمالي تقديري:{' '}
              {pendingItems.reduce((acc, curr) => acc + (curr.estimatedPrice || 0), 0)} ج.م
            </span>
          )}
        </div>

        {pendingItems.length === 0 ? (
          <div className="p-8 text-center bg-white border border-neutral-200/80 rounded-2xl space-y-2">
            <PackageCheck className="w-10 h-10 text-emerald-500 mx-auto stroke-[1.5]" />
            <h3 className="font-extrabold text-sm text-neutral-800">سلة طلبات البيت مكتملة! ✨</h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              مفيش أي نواقص مسجلة حالياً، البيت عامر ومكتمل يا فادي ورحمة ❤️ تقدر تضغط على (+ إضافة غرض) لتسجيل أي نواقص جديدة.
            </p>
          </div>
        ) : (
          pendingItems.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-white border border-neutral-200/80 rounded-2xl flex items-center justify-between shadow-sm hover:border-emerald-300 transition-all gap-2"
            >
              <div
                onClick={() => handleTogglePurchase(item.id, false)}
                className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
              >
                <Circle className="w-5 h-5 text-neutral-300 hover:text-emerald-500 transition-colors shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm text-neutral-800 truncate">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-500 flex-wrap">
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

              {/* Action Buttons: Edit and Delete */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEditModal(item)}
                  className="p-1.5 text-neutral-400 hover:text-brand-600 hover:bg-neutral-100 rounded-lg transition-colors"
                  title="تعديل الغرض"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
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
                className="p-2.5 bg-neutral-50 border border-neutral-200/50 rounded-xl flex items-center justify-between gap-2"
              >
                <div
                  onClick={() => handleTogglePurchase(item.id, true)}
                  className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs text-neutral-500 font-medium line-through truncate">
                    {item.name} ({item.quantity} {item.unit})
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1 text-neutral-400 hover:text-brand-600"
                    title="تعديل"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1 text-neutral-400 hover:text-rose-500"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD ITEM MODAL */}
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
                placeholder="مثال: زيت زيتون، دقيق، مناديل..."
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
                  <option value="جرام">جرام</option>
                  <option value="لتر">لتر</option>
                  <option value="عبوة">عبوة / باكت</option>
                  <option value="كيس">كيس</option>
                  <option value="كرتونة">كرتونة</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">السعر التقديري (ج.م)</label>
                <input
                  type="number"
                  placeholder="اختياري"
                  value={estimatedPrice}
                  onChange={(e) => setEstimatedPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">التصنيف</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-bold"
                >
                  <option value="GROCERIES">المطبخ والأكل</option>
                  <option value="CLEANING">المنظفات والغسيل</option>
                  <option value="HOUSEHOLD">احتياجات المنزل</option>
                  <option value="PHARMACY">الصيدلية والأدوية</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">مين هيشتريه؟</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAssignedToUserId('fady')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    assignedToUserId === 'fady'
                      ? 'bg-rose-50 text-brand-700 border-brand-300'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                  }`}
                >
                  👨🏻‍💻 فادي
                </button>
                <button
                  type="button"
                  onClick={() => setAssignedToUserId('rahma')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    assignedToUserId === 'rahma'
                      ? 'bg-rose-50 text-brand-700 border-brand-300'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                  }`}
                >
                  👩🏻‍🍳 رحمة
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
            >
              إضافة إلى طلبات البيت ✨
            </button>
          </form>
        </div>
      )}

      {/* MODAL 2: EDIT ITEM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-sm text-neutral-800">تعديل الغرض ✏️</h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
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
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">الكمية</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">الوحدة</label>
                <select
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-bold"
                >
                  <option value="قطعة">قطعة / حبة</option>
                  <option value="كجم">كيلوجرام (كجم)</option>
                  <option value="جرام">جرام</option>
                  <option value="لتر">لتر</option>
                  <option value="عبوة">عبوة / باكت</option>
                  <option value="كيس">كيس</option>
                  <option value="كرتونة">كرتونة</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">السعر التقديري (ج.م)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">التصنيف</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-bold"
                >
                  <option value="GROCERIES">المطبخ والأكل</option>
                  <option value="CLEANING">المنظفات والغسيل</option>
                  <option value="HOUSEHOLD">احتياجات المنزل</option>
                  <option value="PHARMACY">الصيدلية والأدوية</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">المسؤول عن الشراء</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditAssignedTo('fady')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    editAssignedTo === 'fady'
                      ? 'bg-rose-50 text-brand-700 border-brand-300'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                  }`}
                >
                  👨🏻‍💻 فادي
                </button>
                <button
                  type="button"
                  onClick={() => setEditAssignedTo('rahma')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    editAssignedTo === 'rahma'
                      ? 'bg-rose-50 text-brand-700 border-brand-300'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                  }`}
                >
                  👩🏻‍🍳 رحمة
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-brand-600/20 active:scale-95 transition-all"
            >
              حفظ التعديلات 💾
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
