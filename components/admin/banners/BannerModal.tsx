import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, ImagePlus } from 'lucide-react';
import { Locale, translations } from '../../../services/i18n';
import { ApiBanner, createBanner, updateBanner } from './banners.api';

interface BannerModalProps {
  lang: Locale;
  open: boolean;
  editing: ApiBanner | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  title_ar: string;
  title_en: string;
  url: string;
  imageFile: File | null;
  imagePreview: string;
}

const INITIAL_FORM: FormState = {
  title_ar: '',
  title_en: '',
  url: '',
  imageFile: null,
  imagePreview: '',
};

const BannerModal: React.FC<BannerModalProps> = ({ lang, open, editing, onClose, onSuccess }) => {
  const t = translations[lang];
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          title_ar: editing.title || '',
          title_en: editing.title || '',
          url: editing.url || '',
          imageFile: null,
          imagePreview: editing.image || '',
        });
      } else {
        setForm(INITIAL_FORM);
      }
    }
  }, [open, editing]);

  if (!open) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(f => ({
      ...f,
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    }));
  };

  const handleSave = async () => {
    if (!form.title_ar.trim() || !form.title_en.trim()) return;
    if (!editing && !form.imageFile) return;

    setSaving(true);
    let res;
    if (editing) {
      res = await updateBanner(
        editing.id,
        {
          image: form.imageFile ?? undefined,
          url: form.url,
          title_ar: form.title_ar.trim(),
          title_en: form.title_en.trim(),
        },
        lang
      );
    } else {
      res = await createBanner(
        {
          image: form.imageFile!,
          url: form.url || undefined,
          title_ar: form.title_ar.trim(),
          title_en: form.title_en.trim(),
        },
        lang
      );
    }
    setSaving(false);

    if (res.ok) {
      onSuccess();
      onClose();
    }
  };

  const isRtl = lang === 'ar';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {editing
                ? isRtl ? 'تعديل البانر' : 'Edit Banner'
                : isRtl ? 'إضافة بانر جديد' : 'Add New Banner'}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {isRtl ? 'أدخل بيانات البانر' : 'Enter banner details'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 mx-1">
              {isRtl ? 'صورة البانر' : 'Banner Image'}
              {!editing && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full h-44 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#483383] transition-colors cursor-pointer overflow-hidden bg-gray-50 flex items-center justify-center group"
            >
              {form.imagePreview ? (
                <img
                  src={form.imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-[#483383] transition-colors">
                  <ImagePlus size={32} />
                  <span className="text-sm font-medium">
                    {isRtl ? 'انقر لرفع صورة' : 'Click to upload image'}
                  </span>
                </div>
              )}
              {form.imagePreview && (
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {isRtl ? 'تغيير الصورة' : 'Change Image'}
                  </span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* Title AR */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 mx-1">
              {isRtl ? 'العنوان (عربي)' : 'Title (Arabic)'}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              dir="rtl"
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383]/10 focus:border-[#483383] transition-all text-sm"
              value={form.title_ar}
              onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))}
              placeholder={isRtl ? 'عنوان البانر بالعربية' : 'عنوان البانر'}
            />
          </div>

          {/* Title EN */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 mx-1">
              {isRtl ? 'العنوان (إنجليزي)' : 'Title (English)'}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              dir="ltr"
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383]/10 focus:border-[#483383] transition-all text-sm"
              value={form.title_en}
              onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))}
              placeholder="Banner title in English"
            />
          </div>

          {/* URL (optional) */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 mx-1">
              {isRtl ? 'الرابط (اختياري)' : 'Link URL (optional)'}
            </label>
            <input
              type="text"
              dir="ltr"
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383]/10 focus:border-[#483383] transition-all text-sm"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="/products"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex gap-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-4 font-bold text-gray-500 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title_ar.trim() || !form.title_en.trim() || (!editing && !form.imageFile)}
            className="flex-[2] py-4 font-bold text-white bg-[#483383] rounded-2xl shadow-lg shadow-[#483383]/20 hover:bg-[#382866] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={20} className="animate-spin" />}
            {saving
              ? isRtl ? 'جاري الحفظ...' : 'Saving...'
              : t.save}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BannerModal;
