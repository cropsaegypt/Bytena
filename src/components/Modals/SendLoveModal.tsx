'use client';

import React, { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { Heart, Send, X, Sparkles } from 'lucide-react';
import { triggerLoveNotification } from '@/lib/love-notifications';

interface SendLoveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS_FADY = [
  'وحشتيني أوي يا روح قلبي 💕',
  'تسلم إيدك يا ست الكل ع الأكل والبيت 🌹',
  'ربنا يخليكي ليا وما يحرمنيش منك أبداً ✨',
  'بفكر فيكي في كل لحظة يا أحلى رحمة ❤️',
  'عملتي قهوتك ولا أعملهولك بنفسي بحب؟ ☕',
  'بحبك أوي يا أغلى نعمة في حياتي 💍',
];

const PRESETS_RAHMA = [
  'ربنا يقويك يا فادي وترجعلي بألف سلامة 💖',
  'مستنياك بأحلى أكلة معمولة مخصوص عشان عيونك 🍽️',
  'يومك جميل ومبارك يا سندي وأغلى الناس ✨',
  'وحشتني أوي يا حبيبي.. خلي بالك من نفسك 💕',
  'فنجان قهوتك مستنيك في بيتنا الدافي ☕',
  'بحبك وبموت فيك يا فادي يا قمر بيتنا ❤️',
];

export default function SendLoveModal({ isOpen, onClose }: SendLoveModalProps) {
  const { currentUser } = useUser();
  const [selectedText, setSelectedText] = useState('');
  const [customText, setCustomText] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const isFady = currentUser.id === 'fady';
  const partnerName = isFady ? 'رحمة' : 'فادي';
  const partnerAvatar = isFady ? '👩🏻‍🍳' : '👨🏻‍💻';
  const presets = isFady ? PRESETS_FADY : PRESETS_RAHMA;

  const handleSend = (textToSend?: string) => {
    const message = textToSend || customText || selectedText;
    if (!message.trim()) return;

    triggerLoveNotification({
      type: 'LOVE_NOTE',
      fromUserId: currentUser.id === 'fady' ? 'fady' : 'rahma',
      toUserId: isFady ? 'rahma' : 'fady',
      title: isFady ? 'نبضة حب ليكي من فادي ❤️' : 'رسالة محبة لـ فادي من رحمة 💕',
      body: message,
      emoji: '❤️',
    });

    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setSelectedText('');
      setCustomText('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 text-neutral-800 shadow-2xl space-y-4 animate-in slide-in-from-bottom-6 border border-rose-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <Heart className="w-5 h-5 fill-white text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-sm text-neutral-900">
                إرسال نبضة حب لـ {partnerName} {partnerAvatar}
              </h3>
              <p className="text-[11px] text-neutral-500">هيظهرلها إشعار رومانسي فوري على الموبايل</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sentSuccess ? (
          <div className="py-8 text-center space-y-2 animate-in zoom-in-95">
            <div className="text-4xl animate-bounce">💖</div>
            <h4 className="font-black text-base text-brand-600">تم إرسال الإشعار لـ {partnerName} بنجاح!</h4>
            <p className="text-xs text-neutral-500 font-medium">وصلها إشعار حب ورنة رقيقة على الموبايل ✨</p>
          </div>
        ) : (
          <>
            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>اختر رسالة سريعة من القلب:</span>
              </label>

              <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {presets.map((msg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedText(msg);
                      setCustomText('');
                    }}
                    className={`text-right p-2.5 rounded-xl text-xs font-bold border transition-all text-neutral-700 ${
                      selectedText === msg
                        ? 'bg-rose-50 border-brand-500 text-brand-700 shadow-sm'
                        : 'bg-neutral-50/80 hover:bg-rose-50/50 border-neutral-200/70'
                    }`}
                  >
                    {msg}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-600">أو اكتب رسالة خاصة من عندك:</label>
              <textarea
                value={customText}
                onChange={(e) => {
                  setCustomText(e.target.value);
                  setSelectedText('');
                }}
                rows={2}
                placeholder={`اكتب كلام حلو لـ ${partnerName}...`}
                className="w-full text-xs p-3 rounded-2xl border border-neutral-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none font-medium"
              />
            </div>

            {/* Action button */}
            <button
              onClick={() => handleSend()}
              disabled={!selectedText && !customText.trim()}
              className="w-full py-3 bg-gradient-to-r from-brand-600 via-rose-500 to-pink-500 disabled:opacity-50 text-white rounded-2xl font-black text-xs shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>إرسال الإشعار لـ {partnerName} فوراً ❤️</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
