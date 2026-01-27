import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  X,
  Scissors,
  LayoutGrid,
  Check,
  Ticket,
  Plus,
  Trash,
  Trash2,
  Copy,
  AlertTriangle,
  ChevronDown,
  Upload,
  Star,
  Image as ImageIcon,
} from "lucide-react";

import { db } from "../../services/db";
import { Product, ServiceSubscription } from "../../types";
import { translations, Locale } from "../../services/i18n";

import { useCategoriesOptions } from "./categories/useCategoriesOptions";
import { useOptionsOptions } from "./services/useOptionsOptions";

import { toast } from "sonner";
import { http } from "../services/http";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";

interface ServiceFormPageProps {
  lang: Locale;
}

type GalleryItem = {
  file: File;
  preview: string; // object url
};

// =========================
// Helpers
// =========================
const normalizeIds = (ids: any[] | undefined) =>
  (ids || [])
    .map((x) => Number(x))
    .filter((n) => !Number.isNaN(n));

const parsePrice = (x: any) => {
  const n = parseFloat(String(x ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// =========================
// Small UI Components
// =========================
function PageHeader({
  lang,
  isEdit,
  id,
  t,
  onCancel,
  onSave,
}: {
  lang: Locale;
  isEdit: boolean;
  id?: string;
  t: any;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onCancel}
          className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-[#483383] hover:shadow-sm transition-all"
        >
          <ArrowLeft size={20} className={lang === "ar" ? "rotate-180" : ""} />
        </button>

        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? t.edit : t.addService}
          </h2>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">
            {isEdit ? `${t.service} ID: ${id}` : "Create new service offering"}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-white border border-gray-100 rounded-2xl font-semibold text-gray-400 hover:bg-gray-50 transition-all flex items-center gap-2"
        >
          <X size={18} />
          <span>{t.cancel}</span>
        </button>

        <button
          onClick={onSave}
          className="px-8 py-3 bg-[#483383] text-white rounded-2xl font-semibold shadow-lg shadow-[#483383]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <Save size={18} />
          <span>{t.save}</span>
        </button>
      </div>
    </header>
  );
}

function BasicInfoCard({
  lang,
  t,
  form,
  setForm,
  catsLoading,
  categories,
}: {
  lang: Locale;
  t: any;
  form: Partial<Product>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Product>>>;
  catsLoading: boolean;
  categories: any[];
}) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
      <h3 className="text-base font-semibold text-gray-900 border-b border-gray-50 pb-4 flex items-center gap-2">
        <Scissors size={18} className="text-[#483383]" />
        Basic Information
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* name ar */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t.serviceNameAr}
          </label>
          <input
            type="text"
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all"
            value={form.name || ""}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="اسم الخدمة بالعربية"
          />
        </div>

        {/* name en */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t.serviceNameEn}
          </label>
          <input
            type="text"
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all text-left"
            dir="ltr"
            value={(form as any).nameEn || ""}
            onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))}
            placeholder="Service Name (English)"
          />
        </div>

        {/* price */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t.price} ({t.currency})
          </label>
          <input
            type="text"
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all"
            value={String(form.price || "")}
            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
          />
        </div>

        {/* duration */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t.duration}
          </label>
          <input
            type="text"
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all"
            value={String((form as any).duration || "")}
            onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
          />
        </div>

        {/* Category Dropdown */}
        <div className="col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t.category ?? (lang === "ar" ? "القسم" : "Category")}
          </label>

          <div className="relative">
            <select
              className={`w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none
                focus:ring-2 focus:ring-[#483383] transition-all appearance-none
                ${lang === "ar" ? "pr-4 pl-12" : "pl-4 pr-12"}`}
              value={((form as any).category_id ?? "") as any}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  category_id: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              disabled={catsLoading}
            >
              <option value="">
                {catsLoading
                  ? lang === "ar"
                    ? "جاري تحميل الأقسام..."
                    : "Loading categories..."
                  : lang === "ar"
                    ? "اختر القسم"
                    : "Select category"}
              </option>

              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {lang === "ar" ? c.name_ar : c.name_en || c.name_ar}
                </option>
              ))}
            </select>

            <ChevronDown
              size={18}
              className={`absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none
                ${lang === "ar" ? "left-4" : "right-4"}`}
            />
          </div>

          {!catsLoading && categories.length === 0 && (
            <p className="text-xs text-red-500 mt-2">
              {lang === "ar" ? "لا يوجد أقسام متاحة حالياً" : "No categories available"}
            </p>
          )}
        </div>

        {/* description */}
        <div className="col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t.description}
          </label>
          <textarea
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all h-32 resize-none"
            value={String(form.description || "")}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );
}

function AddonsCard({
  lang,
  t,
  expanded,
  onToggleExpanded,
  optionsLoading,
  options,
  selectedOptionIds,
  onToggleOption,
}: {
  lang: Locale;
  t: any;
  expanded: boolean;
  onToggleExpanded: () => void;
  optionsLoading: boolean;
  options: any[];
  selectedOptionIds: number[];
  onToggleOption: (id: number) => void;
}) {
  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden transition-all">
      <div
        className="p-8 flex items-center justify-between cursor-pointer hover:bg-gray-50/30 transition-colors"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center gap-3">
          <LayoutGrid size={20} className="text-[#483383]" />
          <h3 className="text-base font-semibold text-gray-900">{t.serviceAddons}</h3>
          <span className="text-[10px] font-bold text-white bg-[#483383] px-2 py-0.5 rounded-lg ml-2">
            {selectedOptionIds.length} Selected
          </span>
        </div>

        <ChevronDown
          size={20}
          className={`text-gray-400 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
        />
      </div>

      {expanded && (
        <div className="px-8 pb-8 pt-0 animate-fadeIn">
          <div className="h-px w-full bg-gray-50 mb-6" />

          {optionsLoading ? (
            <div className="py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-400 font-semibold">
                {lang === "ar" ? "جاري تحميل الخيارات..." : "Loading options..."}
              </p>
            </div>
          ) : options.length === 0 ? (
            <div className="py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-400 font-semibold">
                {lang === "ar" ? "لا يوجد خيارات حالياً" : "No options available"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.map((opt) => {
                const isSelected = selectedOptionIds.includes(opt.id);

                return (
                  <div
                    key={opt.id}
                    onClick={() => onToggleOption(opt.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${isSelected
                        ? "border-[#483383] bg-violet-50"
                        : "border-gray-100 bg-white hover:border-gray-300"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${isSelected
                            ? "bg-[#483383] border-[#483383] text-white"
                            : "bg-gray-50 border-gray-200 text-transparent"
                          }`}
                      >
                        <Check size={14} strokeWidth={4} />
                      </div>

                      <div>
                        <p
                          className={`text-sm font-bold ${isSelected ? "text-[#483383]" : "text-gray-900"
                            }`}
                        >
                          {lang === "ar" ? opt.title_ar : opt.title_en}
                        </p>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">
                          {opt.values_count} {lang === "ar" ? "اختيارات" : "Options"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${opt.is_required
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-400"
                        }`}
                    >
                      {opt.is_required ? t.required : t.optional}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubscriptionsCard({
  lang,
  t,
  subscriptions,
  onAdd,
  onRemove,
  onDuplicate,
  onChange,
  calcPreview,
}: {
  lang: Locale;
  t: any;
  subscriptions: any[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onDuplicate: (sub: any) => void;
  onChange: (id: string, field: keyof ServiceSubscription, value: any) => void;
  calcPreview: (sessions: number, percent: number) => number;
}) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-50 pb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Ticket size={18} className="text-[#483383]" />
            {t.serviceSubscriptions}
          </h3>
          <p className="text-[10px] text-gray-400 mt-1 font-semibold">{t.subscriptionsHelper}</p>
        </div>

        <button
          onClick={onAdd}
          className="bg-[#483383]/10 text-[#483383] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#483383] hover:text-white transition-all"
        >
          <Plus size={16} />
          <span>{t.addSubscription}</span>
        </button>
      </div>

      <div className="space-y-4">
        {subscriptions.length === 0 && (
          <div className="py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-sm text-gray-400 font-semibold">{t.noContentYet}</p>
          </div>
        )}

        {subscriptions.map((sub: any) => (
          <div
            key={sub.id}
            className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 relative group transition-all hover:border-gray-200 hover:shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  {t.subscriptionTitle}
                </label>
                <input
                  type="text"
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-[#483383]"
                  value={sub.title}
                  onChange={(e) => onChange(sub.id, "title", e.target.value)}
                  placeholder={lang === "ar" ? "مثال: باقة التوفير" : "e.g. Saver Package"}
                />
              </div>

              <div className="flex gap-2 mr-4 ml-4">
                <button
                  onClick={() => onDuplicate(sub)}
                  className="p-2 text-gray-400 hover:text-blue-500 bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
                  title={t.duplicate}
                >
                  <Copy size={16} />
                </button>

                <button
                  onClick={() => onRemove(sub.id)}
                  className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
                  title={t.delete}
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  {t.sessionsCount}
                </label>
                <input
                  type="number"
                  min="2"
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-[#483383]"
                  value={sub.sessionsCount}
                  onChange={(e) =>
                    onChange(sub.id, "sessionsCount", parseInt(e.target.value || "0", 10))
                  }
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  {t.pricePercent}
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-[#483383]"
                  value={sub.pricePercent}
                  onChange={(e) =>
                    onChange(sub.id, "pricePercent", parseInt(e.target.value || "0", 10))
                  }
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  {t.validityDays}
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-[#483383]"
                  value={sub.validityDays}
                  onChange={(e) =>
                    onChange(sub.id, "validityDays", parseInt(e.target.value || "0", 10))
                  }
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
              <p className="text-[10px] font-semibold text-gray-500">
                {t.estimatedTotal}:{" "}
                <span className="text-[#483383] text-sm">
                  {calcPreview(sub.sessionsCount, sub.pricePercent).toFixed(3)} {t.currency}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MediaCard({
  mainImagePreview,
  onMainImageUpload,
  onRemoveMainImage,
  gallery,
  onGalleryUpload,
  onSetAsMain,
  onRemoveGalleryImage,
}: {
  mainImagePreview: string;
  onMainImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveMainImage: () => void;
  gallery: GalleryItem[];
  onGalleryUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSetAsMain: (index: number) => void;
  onRemoveGalleryImage: (index: number) => void;
}) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
      <h3 className="text-base font-semibold text-gray-900 border-b border-gray-50 pb-4">
        Service Media
      </h3>

      {/* Main Image */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Main Image (Required)
        </label>

        {mainImagePreview ? (
          <div className="relative aspect-video rounded-2xl overflow-hidden group border border-gray-200">
            <img src={String(mainImagePreview)} className="w-full h-full object-cover" alt="Main" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <label className="cursor-pointer px-4 py-2 bg-white rounded-xl text-xs font-semibold hover:bg-gray-100">
                Change
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={onMainImageUpload}
                />
              </label>
              <button
                onClick={onRemoveMainImage}
                className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-[#483383] hover:bg-violet-50 transition-all bg-gray-50">
            <Upload size={32} className="text-gray-300" />
            <span className="text-sm font-semibold text-gray-400 mt-2">Upload Main Image</span>
            <input type="file" className="hidden" accept="image/*" onChange={onMainImageUpload} />
          </label>
        )}
      </div>

      {/* Gallery */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-700">Gallery Images</label>
          <label className="cursor-pointer text-[#483383] text-xs font-semibold hover:underline flex items-center gap-1">
            <Plus size={14} /> Add Images
            <input type="file" multiple className="hidden" accept="image/*" onChange={onGalleryUpload} />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {gallery.map((g, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100 bg-gray-50"
            >
              <img src={g.preview} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onSetAsMain(idx)}
                  className="p-1.5 bg-white/90 rounded-lg text-yellow-500 hover:bg-white shadow-sm"
                  title="Set as Main"
                >
                  <Star size={12} fill="currentColor" />
                </button>
                <button
                  onClick={() => onRemoveGalleryImage(idx)}
                  className="p-1.5 bg-white/90 rounded-lg text-red-500 hover:bg-white shadow-sm"
                  title="Remove"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}

          {gallery.length === 0 && (
            <div className="col-span-3 py-8 text-center border border-dashed border-gray-200 rounded-2xl">
              <ImageIcon size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs font-semibold text-gray-400">No gallery images</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExitPrompt({
  lang,
  open,
  onConfirm,
  onClose,
}: {
  lang: Locale;
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-scaleIn text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
          <AlertTriangle size={32} />
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-2">
          {lang === "ar" ? "تنبيه: تغييرات غير محفوظة" : "Unsaved Changes"}
        </h2>

        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          {lang === "ar"
            ? "لديك تعديلات غير محفوظة. هل تريد الخروج بدون حفظ؟"
            : "You have unsaved changes. Are you sure you want to leave without saving?"}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-4 bg-red-50 text-red-600 font-semibold rounded-2xl active:scale-95 transition-transform"
          >
            {lang === "ar" ? "نعم، خروج بدون حفظ" : "Yes, Leave without Saving"}
          </button>

          <button
            onClick={onClose}
            className="w-full py-4 bg-gray-50 text-gray-700 font-semibold rounded-2xl active:scale-95 transition-transform"
          >
            {lang === "ar" ? "إلغاء" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================
// Main Component
// =========================
const ServiceFormPage: React.FC<ServiceFormPageProps> = ({ lang }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const t = translations[lang];
  const isEdit = !!id;

  const [form, setForm] = useState<Partial<Product>>({
    name: "",
    nameEn: "",
    description: "",
    price: "",
    image: "",
    images: [],
    duration: "60 mins",
    globalAddonIds: [],
    subscriptions: [],
    category_id: undefined as any,
  });

  const [initialForm, setInitialForm] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [isAddonsExpanded, setIsAddonsExpanded] = useState(false);

  // files for API
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>("");
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  const { isLoading: catsLoading, rows: categories } = useCategoriesOptions(lang);
  const { isLoading: optionsLoading, rows: options } = useOptionsOptions(lang);

  const selectedOptionIds = useMemo(
    () => normalizeIds(form.globalAddonIds as any),
    [form.globalAddonIds]
  );

  const hasUnsavedChanges = () => JSON.stringify(form) !== initialForm;

  const handleCancel = () => {
    if (hasUnsavedChanges()) setShowExitPrompt(true);
    else navigate("/admin/services");
  };

  const confirmExit = () => navigate("/admin/services");

  const handleToggleGlobalAddon = (optionId: number) => {
    const current = normalizeIds(form.globalAddonIds as any);
    const next = current.includes(optionId)
      ? current.filter((x) => x !== optionId)
      : [...current, optionId];
    setForm((p) => ({ ...p, globalAddonIds: next as any }));
  };

  // ----------------- Image Handling -----------------
  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // cleanup old preview only if it was objectUrl (we can’t safely detect url type, so keep it simple)
    // if previous preview was object url it will be revoked on unmount anyway

    const preview = URL.createObjectURL(file);
    setMainImageFile(file);
    setMainImagePreview(preview);
    setForm((prev) => ({ ...prev, image: preview }));
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const items: GalleryItem[] = Array.from(files).map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
    }));

    setGallery((prev) => [...prev, ...items]);
    setForm((prev) => ({
      ...prev,
      images: [...(prev.images || []), ...items.map((x) => x.preview)],
    }));
  };

  const handleRemoveMainImage = () => {
    // don't revoke here (could be remote url). revoke object urls on unmount.
    setMainImageFile(null);
    setMainImagePreview("");
    setForm((prev) => ({ ...prev, image: "" }));
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGallery((prev) => {
      const item = prev[index];
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });

    setForm((prev) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index),
    }));
  };

  const handleSetAsMain = (index: number) => {
    const item = gallery[index];
    if (!item) return;

    setGallery((prev) => {
      const next = [...prev];
      next.splice(index, 1);

      // push current main into gallery only if it's a real file
      if (mainImageFile && mainImagePreview) {
        next.unshift({ file: mainImageFile, preview: mainImagePreview });
      }

      return next;
    });

    setMainImageFile(item.file);
    setMainImagePreview(item.preview);

    setForm((prev) => ({
      ...prev,
      image: item.preview,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  };

  // cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      gallery.forEach((g) => g.preview && URL.revokeObjectURL(g.preview));
      // mainImagePreview might be remote url; no revoke.
      // if it is object url, it will stay but this is minor; you can track a boolean if you want.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------- API: GET service by id -----------------
  async function fetchServiceById(serviceId: string) {
    const res = await http.get(`${DASHBOARD_API_BASE_URL}/services/${serviceId}`, {
      headers: { lang },
    });
    const ok = !!res?.data?.status;
    if (!ok) throw new Error(res?.data?.message || "Failed to load service");
    return res.data.items;
  }

  // ----------------- Load (Create / Edit) -----------------
  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setIsLoading(true);
        setNotFound(false);

        if (isEdit && id) {
          const item = await fetchServiceById(id);

          const data: Partial<Product> = {
            name: String(item?.name || ""),
            nameEn: String(item?.name || ""),
            description: String(item?.description || ""),
            price: String(item?.price ?? ""),
            image: String(item?.main_image || ""),
            images: [],
            duration: "60 mins",
            category_id: item?.category?.id ?? undefined,
            globalAddonIds: normalizeIds((item?.options || []).map((o: any) => o.id)),
            subscriptions: (item?.subscriptions || []).map((s: any) => ({
              id: `sub_${s.id}`,
              title: s.name || "",
              sessionsCount: Number(s.session_count || 0),
              pricePercent: Number(parseFloat(String(s.price_percentage || 0))),
              validityDays: Number(s.validity_days || 0),
            })),
          };

          if (!mounted) return;

          setForm(data);
          setInitialForm(JSON.stringify(data));

          setMainImagePreview(String(item?.main_image || ""));
          setMainImageFile(null);
          setGallery([]);
        } else {
          const empty: Partial<Product> = {
            name: "",
            nameEn: "",
            description: "",
            price: "",
            image: "",
            images: [],
            duration: "60 mins",
            globalAddonIds: [],
            subscriptions: [],
            category_id: undefined as any,
          };

          if (!mounted) return;

          setForm(empty);
          setInitialForm(JSON.stringify(empty));
          setMainImageFile(null);
          setMainImagePreview("");
          setGallery([]);
        }
      } catch (e) {
        console.error(e);
        if (mounted) setNotFound(true);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [id, isEdit, lang]);

  // ----------------- Subscriptions handlers -----------------
  const handleAddSubscription = () => {
    const newSub: ServiceSubscription = {
      id: `sub_${Date.now()}`,
      title: "",
      sessionsCount: 2,
      pricePercent: 100,
      validityDays: 30,
    };
    setForm((prev) => ({
      ...prev,
      subscriptions: [...(prev.subscriptions || []), newSub],
    }));
  };

  const handleRemoveSubscription = (subId: string) => {
    setForm((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions?.filter((s: any) => s.id !== subId),
    }));
  };

  const handleSubscriptionChange = (
    subId: string,
    field: keyof ServiceSubscription,
    value: any
  ) => {
    setForm((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions?.map((s: any) =>
        s.id === subId ? { ...s, [field]: value } : s
      ),
    }));
  };

  const handleDuplicateSubscription = (sub: ServiceSubscription) => {
    const newSub: ServiceSubscription = {
      ...sub,
      id: `sub_copy_${Date.now()}`,
      title: `${sub.title} (${t.copy})`,
    };
    setForm((prev) => ({
      ...prev,
      subscriptions: [...(prev.subscriptions || []), newSub],
    }));
  };

  const calculatePreviewPrice = (sessions: number, percent: number) => {
    const basePrice = parsePrice(form.price);
    const baseTotal = basePrice * sessions;
    return baseTotal * (percent / 100);
  };

  // ----------------- Create Service API (FormData) -----------------
  async function createService() {
    const fd = new FormData();

    fd.append("price", String(parsePrice(form.price)));
    fd.append("service_type", "configurable");
    fd.append("category_id", String((form as any).category_id));

    if (!mainImageFile) {
      toast(lang === "ar" ? "يرجى إضافة الصورة الرئيسية" : "Please add a main image.");
      throw new Error("main_image missing");
    }
    fd.append("main_image", mainImageFile);

    // translations
    fd.append("translations[0][language]", "ar");
    fd.append("translations[0][name]", String(form.name || ""));
    fd.append("translations[0][description]", String(form.description || ""));

    fd.append("translations[1][language]", "en");
    fd.append("translations[1][name]", String((form as any).nameEn || form.name || ""));
    fd.append("translations[1][description]", String(form.description || ""));

    // gallery
    gallery.forEach((g, i) => {
      fd.append(`images[${i}][image]`, g.file);
      fd.append(`images[${i}][sort_order]`, String(i + 1));
    });

    // option_ids
    selectedOptionIds.forEach((optId, i) => {
      fd.append(`option_ids[${i}]`, String(optId));
    });

    // subscriptions
    const subs = (form.subscriptions || []) as any[];
    subs.forEach((sub, i) => {
      const sessions = Number(sub.sessionsCount || 0);
      const percent = Number(sub.pricePercent || 0);
      const fixed = calculatePreviewPrice(sessions, percent);
      const pps = sessions > 0 ? fixed / sessions : 0;

      fd.append(`subscriptions[${i}][session_count]`, String(sessions));
      fd.append(`subscriptions[${i}][price_percentage]`, String(percent));
      fd.append(`subscriptions[${i}][fixed_price]`, String(fixed));
      fd.append(`subscriptions[${i}][price_per_session]`, String(pps));
      fd.append(`subscriptions[${i}][validity_days]`, String(Number(sub.validityDays || 0)));
      fd.append(`subscriptions[${i}][is_active]`, "1");

      fd.append(`subscriptions[${i}][translations][0][language]`, "ar");
      fd.append(`subscriptions[${i}][translations][0][name]`, String(sub.title || ""));
      fd.append(`subscriptions[${i}][translations][0][description]`, "");

      fd.append(`subscriptions[${i}][translations][1][language]`, "en");
      fd.append(`subscriptions[${i}][translations][1][name]`, String(sub.title || ""));
      fd.append(`subscriptions[${i}][translations][1][description]`, "");
    });

    const res = await http.post(`${DASHBOARD_API_BASE_URL}/services`, fd, {
      headers: {
        lang,
        "Content-Type": "multipart/form-data",
      },
    });

    const ok = !!res?.data?.status;
    const msg = res?.data?.message || (ok ? "Created" : "Failed");

    toast(msg, {
      style: {
        background: ok ? "#198754" : "#dc3545",
        color: "#fff",
        borderRadius: "10px",
      },
    });

    if (!ok) throw new Error(msg);
    return res.data;
  }

  // ----------------- Save -----------------
  const handleSave = async () => {
    if (!form.name) {
      toast(lang === "ar" ? "يرجى إدخال اسم الخدمة" : "Please enter the service name.");
      return;
    }

    if (!(form as any).category_id) {
      toast(lang === "ar" ? "يرجى اختيار القسم" : "Please select a category.");
      return;
    }

    const hasMainImage = !!mainImageFile || !!mainImagePreview;
    if (!hasMainImage) {
      toast(lang === "ar" ? "يرجى إضافة الصورة الرئيسية" : "Please add a main image.");
      return;
    }

    if (form.subscriptions) {
      for (const sub of form.subscriptions as any[]) {
        if (!sub.title || sub.title.trim().length < 2) {
          toast(
            lang === "ar"
              ? "يرجى إدخال عنوان صحيح لجميع الاشتراكات"
              : "Please enter a valid title for all subscriptions."
          );
          return;
        }
        if (Number(sub.sessionsCount) < 2) {
          toast(
            lang === "ar"
              ? `عدد الجلسات يجب أن يكون 2 على الأقل للاشتراك: ${sub.title}`
              : `Sessions count must be at least 2 for subscription: ${sub.title}`
          );
          return;
        }
        if (Number(sub.validityDays) < 1) {
          toast(
            lang === "ar"
              ? `مدة الصلاحية يجب أن تكون يوم واحد على الأقل للاشتراك: ${sub.title}`
              : `Validity days must be at least 1 for subscription: ${sub.title}`
          );
          return;
        }
      }
    }

    try {
      if (isEdit) {
        // TODO: replace with API update when you provide endpoint
        const payload = {
          ...form,
          globalAddonIds: normalizeIds(form.globalAddonIds as any),
        };
        db.updateEntity("services", Number(id), payload);
        db.addLog(
          "Admin",
          "admin",
          "update",
          "Service",
          id!,
          "Service Updated",
          `Admin updated service details for ${form.name}`,
          "info",
          form.name
        );
        navigate("/admin/services");
      } else {
        await createService();
        navigate("/admin/services");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ----------------- Render -----------------
  if (isLoading) return null;

  if (notFound) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <p className="text-gray-500 font-semibold">Service not found</p>
        <button
          onClick={() => navigate("/admin/services")}
          className="bg-[#483383] text-white px-6 py-2 rounded-xl font-semibold"
        >
          Back to Services
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-20 relative">
      <PageHeader
        lang={lang}
        isEdit={isEdit}
        id={id}
        t={t}
        onCancel={handleCancel}
        onSave={handleSave}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left */}
        <div className="lg:col-span-2 space-y-8">
          <BasicInfoCard
            lang={lang}
            t={t}
            form={form}
            setForm={setForm}
            catsLoading={catsLoading}
            categories={categories}
          />

          <AddonsCard
            lang={lang}
            t={t}
            expanded={isAddonsExpanded}
            onToggleExpanded={() => setIsAddonsExpanded((x) => !x)}
            optionsLoading={optionsLoading}
            options={options}
            selectedOptionIds={selectedOptionIds}
            onToggleOption={handleToggleGlobalAddon}
          />

          <SubscriptionsCard
            lang={lang}
            t={t}
            subscriptions={(form.subscriptions || []) as any[]}
            onAdd={handleAddSubscription}
            onRemove={handleRemoveSubscription}
            onDuplicate={handleDuplicateSubscription}
            onChange={handleSubscriptionChange}
            calcPreview={calculatePreviewPrice}
          />
        </div>

        {/* Right */}
        <div className="space-y-6">
          <MediaCard
            mainImagePreview={mainImagePreview}
            onMainImageUpload={handleMainImageUpload}
            onRemoveMainImage={handleRemoveMainImage}
            gallery={gallery}
            onGalleryUpload={handleGalleryUpload}
            onSetAsMain={handleSetAsMain}
            onRemoveGalleryImage={handleRemoveGalleryImage}
          />
        </div>
      </div>

      <ExitPrompt
        lang={lang}
        open={showExitPrompt}
        onConfirm={confirmExit}
        onClose={() => setShowExitPrompt(false)}
      />
    </div>
  );
};

export default ServiceFormPage;
