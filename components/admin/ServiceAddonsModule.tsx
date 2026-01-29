import React, { useEffect, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  X,
  ListPlus,
  Trash,
  Save,
  LayoutGrid,
  Loader2,
} from "lucide-react";
import { translations, Locale } from "../../services/i18n";
import { toast } from "sonner";
import { http } from "../services/http";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";

// -------------------
// Types from API
// -------------------
export type ApiOptionTranslation = {
  id: number;
  option_id: number;
  language: "ar" | "en";
  title: string;
};

export type ApiOptionValueTranslation = {
  id: number;
  option_value_id: number;
  language: "ar" | "en";
  name: string;
  description: string | null;
};

export type ApiOptionValue = {
  id: number;
  option_id: number;
  price: string;
  is_default: number;
  sort_order: number;
  is_active: number;
  translations: ApiOptionValueTranslation[];
};

export type ApiOption = {
  id: number;
  is_required: number;
  is_multiple_choice: number;
  sort_order: number;
  is_active: number;
  translations: ApiOptionTranslation[];
  values: ApiOptionValue[];
};

export type ApiPaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

type ApiOptionsResponse = {
  status: boolean;
  data: {
    data: ApiOption[];
    meta: ApiPaginationMeta;
  };
  message: string;
};

function toastApi(status: boolean, message: string) {
  toast(message || (status ? "Success" : "Something went wrong"), {
    style: {
      background: status ? "#198754" : "#dc3545",
      color: "#fff",
      borderRadius: "10px",
    },
  });
}

// -------------------
// UI Model
// -------------------
type GlobalAddonItem = {
  id: string;
  labelEn: string;
  labelAr: string;
  price: number;
};

type GlobalAddon = {
  id: string; // option id
  titleEn: string;
  titleAr: string;
  required: boolean;
  selectionType: "single" | "multiple";
  items: GlobalAddonItem[];
  createdAt?: string;
  updatedAt?: string;
};

// helpers
const getTr = <T extends { language: "ar" | "en" }>(
  arr: T[] | undefined,
  lang: "ar" | "en"
) => (arr || []).find((x) => x.language === lang);

const toNum = (x: any) => {
  const n = Number.parseFloat(String(x ?? "0"));
  return Number.isFinite(n) ? n : 0;
};

function mapApiOptionToAddon(opt: ApiOption): GlobalAddon {
  const trEn = getTr(opt.translations, "en");
  const trAr = getTr(opt.translations, "ar");

  const items = (opt.values || [])
    .slice()
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .map((v) => {
      const vEn = getTr(v.translations, "en");
      const vAr = getTr(v.translations, "ar");
      return {
        id: String(v.id),
        labelEn: vEn?.name || "",
        labelAr: vAr?.name || "",
        price: toNum(v.price),
      };
    });

  return {
    id: String(opt.id),
    titleEn: trEn?.title || "",
    titleAr: trAr?.title || "",
    required: !!opt.is_required,
    selectionType: opt.is_multiple_choice ? "multiple" : "single",
    items,
  };
}

// -------------------
// API fetch helpers
// -------------------
async function fetchOptionsPage(params: {
  lang: Locale;
  page: number;
  per_page: number;
}) {
  const res = await http.get<ApiOptionsResponse>(`${DASHBOARD_API_BASE_URL}/options`, {
    params: { page: params.page, per_page: params.per_page },
    headers: { lang: params.lang },
  });

  if (!res?.data?.status) throw new Error(res?.data?.message || "Failed to load options");
  return { rows: res.data.data.data, meta: res.data.data.meta };
}

async function fetchAllOptions(params: { lang: Locale; per_page: number }) {
  const all: ApiOption[] = [];
  let page = 1;

  while (true) {
    const { rows, meta } = await fetchOptionsPage({
      lang: params.lang,
      page,
      per_page: params.per_page,
    });

    all.push(...rows);
    if (!meta || page >= meta.last_page) break;
    page += 1;
  }

  return all;
}

// -------------------
// CREATE / EDIT FormData (same keys like screenshot)
// -------------------
function buildOptionFormData(args: { form: Partial<GlobalAddon>; mode: "create" | "edit" }) {
  const { form, mode } = args;
  const fd = new FormData();

  // Laravel update with multipart
  if (mode === "edit") fd.append("_method", "PUT");

  fd.append("is_required", String(form.required ? 1 : 0));
  fd.append("is_multiple_choice", String(form.selectionType === "multiple" ? 1 : 0));
  fd.append("sort_order", "1");
  fd.append("is_active", "1");

  fd.append("translations[0][language]", "ar");
  fd.append("translations[0][title]", String(form.titleAr || ""));

  fd.append("translations[1][language]", "en");
  fd.append("translations[1][title]", String(form.titleEn || ""));

  const items = form.items || [];
  items.forEach((it: any, idx: number) => {
    fd.append(`values[${idx}][price]`, String(it.price ?? 0));
    fd.append(`values[${idx}][is_default]`, idx === 0 ? "1" : "0");
    fd.append(`values[${idx}][sort_order]`, String(idx + 1));
    fd.append(`values[${idx}][is_active]`, "1");

    fd.append(`values[${idx}][translations][0][language]`, "ar");
    fd.append(`values[${idx}][translations][0][name]`, String(it.labelAr || ""));
    fd.append(`values[${idx}][translations][0][description]`, "");

    fd.append(`values[${idx}][translations][1][language]`, "en");
    fd.append(`values[${idx}][translations][1][name]`, String(it.labelEn || ""));
  });

  return fd;
}

async function createOption(params: { lang: Locale; form: Partial<GlobalAddon> }) {
  const fd = buildOptionFormData({ form: params.form, mode: "create" });

  const res = await http.post(`${DASHBOARD_API_BASE_URL}/options`, fd, {
    headers: { lang: params.lang, Accept: "application/json" },
  });

  const ok = !!res?.data?.status;
  toastApi(ok, res?.data?.message || (ok ? "Created" : "Failed"));
  if (!ok) throw new Error(res?.data?.message || "Failed");
  return res.data;
}

async function updateOption(params: { lang: Locale; id: string | number; form: Partial<GlobalAddon> }) {
  const fd = buildOptionFormData({ form: params.form, mode: "edit" });

  const res = await http.post(`${DASHBOARD_API_BASE_URL}/options/${params.id}`, fd, {
    headers: { lang: params.lang, Accept: "application/json" },
  });

  const ok = !!res?.data?.status;
  toastApi(ok, res?.data?.message || (ok ? "Updated" : "Failed"));
  if (!ok) throw new Error(res?.data?.message || "Failed");
  return res.data;
}

// ✅ DELETE endpoint: {{url}}/options/:id
async function deleteOption(params: { lang: Locale; id: string | number }) {
  const res = await http.delete(`${DASHBOARD_API_BASE_URL}/options/${params.id}`, {
    headers: { lang: params.lang, Accept: "application/json" },
  });

  const ok = !!res?.data?.status;
  toastApi(ok, res?.data?.message || (ok ? "Deleted" : "Failed"));
  if (!ok) throw new Error(res?.data?.message || "Failed");
  return res.data;
}

// -------------------
// Component
// -------------------
interface ServiceAddonsModuleProps {
  lang: Locale;
}

const ServiceAddonsModule: React.FC<ServiceAddonsModuleProps> = ({ lang }) => {
  const t = translations[lang];

  const [isLoading, setIsLoading] = useState(true);
  const [apiAddons, setApiAddons] = useState<GlobalAddon[]>([]);
  const [apiError, setApiError] = useState<string>("");

  // local only for duplicate (delete now API)
  const [localAddons, setLocalAddons] = useState<GlobalAddon[] | null>(null);
  const addons = localAddons ?? apiAddons;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<GlobalAddon | null>(null);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<GlobalAddon>>({
    titleEn: "",
    titleAr: "",
    required: false,
    selectionType: "single",
    items: [{ id: "1", labelEn: "", labelAr: "", price: 0 }],
  });

  const reload = async () => {
    try {
      setIsLoading(true);
      setApiError("");

      const per_page = 50;
      const options = await fetchAllOptions({ lang, per_page });

      const mapped = options
        .slice()
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
        .map(mapApiOptionToAddon);

      setApiAddons(mapped);
      setLocalAddons(null);
    } catch (e: any) {
      setApiError(e?.message || "Failed to load options");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await reload();
      if (!mounted) return;
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const handleOpenModal = (addon?: GlobalAddon) => {
    if (addon) {
      setEditingAddon(addon);
      setForm(JSON.parse(JSON.stringify(addon)));
    } else {
      setEditingAddon(null);
      setForm({
        titleEn: "",
        titleAr: "",
        required: false,
        selectionType: "single",
        items: [{ id: "1", labelEn: "", labelAr: "", price: 0 }],
      });
    }
    setModalOpen(true);
  };

  const handleAddItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        { id: Date.now().toString(), labelEn: "", labelAr: "", price: 0 },
      ],
    }));
  };

  const handleRemoveItem = (idx: number) => {
    if ((form.items?.length || 0) <= 1) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== idx),
    }));
  };

  const handleItemChange = (idx: number, field: keyof GlobalAddonItem, value: any) => {
    const nextItems = [...(form.items || [])] as any[];
    nextItems[idx] = { ...nextItems[idx], [field]: value };
    setForm({ ...form, items: nextItems });
  };

  const validateForm = () => {
    if (!form.titleEn || !form.titleAr) return false;
    if ((form.items?.length || 0) === 0) return false;
    for (const it of form.items || []) {
      if (!it.labelEn || !it.labelAr) return false;
    }
    return true;
  };

  const handleSave = async () => {
    // if (!validateForm()) {
    //   toast(
    //     lang === "ar"
    //       ? "لازم تدخل (عنوان عربي/إنجليزي) + عنصر واحد على الأقل (اسم عربي/إنجليزي)"
    //       : "Title (AR/EN) + at least 1 item (name AR/EN) is required",
    //     { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } }
    //   );
    //   return;
    // }

    try {
      setSaving(true);

      if (editingAddon) {
        await updateOption({ lang, id: editingAddon.id, form });
      } else {
        await createOption({ lang, form });
      }

      await reload();
      setModalOpen(false);
    } catch (e: any) {
      toast(e?.message || (lang === "ar" ? "حدث خطأ" : "Something went wrong"), {
        style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (addon: GlobalAddon) => {
    try {
      setDeletingId(addon.id);

      const duplicatedForm: Partial<GlobalAddon> = {
        titleEn: `${addon.titleEn} (${t.copy})`,
        titleAr: `${addon.titleAr} (${t.copy})`,
        required: addon.required,
        selectionType: addon.selectionType,
        items: addon.items.map(item => ({
          ...item,
          id: `temp_${Date.now()}_${Math.random()}`,
        })),
      };

      await createOption({ lang, form: duplicatedForm });
      await reload();

      toast(lang === "ar" ? "تم النسخ بنجاح" : "Duplicated successfully", {
        style: { background: "#198754", color: "#fff", borderRadius: "10px" },
      });
    } catch (e: any) {
      toast(e?.message || (lang === "ar" ? "فشل النسخ" : "Duplicate failed"), {
        style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = async (addonId: string) => {
    if (!confirm(t.confirmDelete)) return;

    try {
      setDeletingId(addonId);

      // ✅ delete from API (real id only)
      // If this is a local duplicated item (id starts with "local_"), delete locally only
      if (String(addonId).startsWith("local_") || String(addonId).startsWith("local_copy_")) {
        setLocalAddons((prev) => (prev ?? addons).filter((x) => x.id !== addonId));
        toast(lang === "ar" ? "تم الحذف (محليًا)" : "Deleted (local)", {
          style: { background: "#198754", color: "#fff", borderRadius: "10px" },
        });
        return;
      }

      await deleteOption({ lang, id: addonId });

      await reload();
    } catch (e: any) {
      toast(e?.message || (lang === "ar" ? "فشل الحذف" : "Delete failed"), {
        style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
      });
    } finally {
      setDeletingId(null);
    }
  };

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
          <div className="h-5 w-2/3 bg-gray-50 rounded-xl animate-pulse mb-4" />
          <div className="h-4 w-1/2 bg-gray-50 rounded-xl animate-pulse mb-6" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-50 rounded-xl animate-pulse" />
            <div className="h-4 bg-gray-50 rounded-xl animate-pulse" />
            <div className="h-4 bg-gray-50 rounded-xl animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#483383]/10 text-[#483383] rounded-2xl">
            <LayoutGrid size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t.serviceAddons}</h2>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">
              {addons.length} {lang === "ar" ? "تصنيفات" : "Add-on Categories"}
              {isLoading ? " ..." : ""}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-[#483383] text-white px-6 py-4 rounded-2xl font-semibold flex items-center gap-2 shadow-lg shadow-[#483383]/20 active:scale-95 transition-all"
        >
          <Plus size={20} />
          <span>{t.addAddon}</span>
        </button>
      </div>

      {apiError && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600 font-semibold">
          {apiError}
        </div>
      )}

      {isLoading ? (
        renderSkeleton()
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {addons.map((addon) => (
            <div
              key={addon.id}
              className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col group"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {lang === "ar" ? addon.titleAr : addon.titleEn}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg border ${addon.required
                        ? "bg-red-50 text-red-500 border-red-100"
                        : "bg-green-50 text-green-600 border-green-100"
                        }`}
                    >
                      {addon.required ? t.required : t.optional}
                    </span>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg bg-violet-50 text-[#483383] border border-violet-100">
                      {addon.selectionType === "single" ? t.singleChoice : t.multipleChoice}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDuplicate(addon)}
                    className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all"
                    title={t.duplicate}
                  >
                    <Copy size={16} />
                  </button>

                  <button
                    onClick={() => handleOpenModal(addon)}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                    title={t.edit}
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(addon.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-60"
                    title={t.delete}
                    disabled={deletingId === addon.id}
                  >
                    {deletingId === addon.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-8">
                {addon.items.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-normal">
                      {lang === "ar" ? item.labelAr : item.labelEn}
                    </span>
                    <span className="text-gray-900 font-semibold">
                      {Number(item.price).toFixed(3)} {t.currency}
                    </span>
                  </div>
                ))}
                {addon.items.length > 3 && (
                  <div className="text-[10px] text-gray-400 font-semibold text-center mt-2">
                    +{addon.items.length - 3} More Options
                  </div>
                )}
              </div>

              <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">
                  {addon.items.length} {t.items}
                </span>
                <button
                  onClick={() => handleOpenModal(addon)}
                  className="text-xs font-bold text-[#483383] hover:underline flex items-center gap-1"
                >
                  {t.edit} <ChevronRight size={14} className={lang === "ar" ? "rotate-180" : ""} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-gray-900">
                {editingAddon ? t.editAddon : t.addAddon}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                disabled={saving}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-10 overflow-y-auto no-scrollbar space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.titleEn}</label>
                  <input
                    type="text"
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all"
                    value={form.titleEn || ""}
                    onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                  />
                </div>

                <div className="space-y-2 text-right">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.titleAr}</label>
                  <input
                    type="text"
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all text-right"
                    value={form.titleAr || ""}
                    onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">{t.required}</label>
                  <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl w-fit">
                    <button
                      onClick={() => setForm({ ...form, required: true })}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${form.required ? "bg-[#483383] text-white" : "text-gray-400"
                        }`}
                      disabled={saving}
                    >
                      {t.required}
                    </button>
                    <button
                      onClick={() => setForm({ ...form, required: false })}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${!form.required ? "bg-white shadow-sm text-gray-900 border border-gray-100" : "text-gray-400"
                        }`}
                      disabled={saving}
                    >
                      {t.optional}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">{t.selectionType}</label>
                  <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl w-fit">
                    <button
                      onClick={() => setForm({ ...form, selectionType: "single" })}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${form.selectionType === "single" ? "bg-[#483383] text-white" : "text-gray-400"
                        }`}
                      disabled={saving}
                    >
                      {t.singleChoice}
                    </button>
                    <button
                      onClick={() => setForm({ ...form, selectionType: "multiple" })}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${form.selectionType === "multiple" ? "bg-[#483383] text-white" : "text-gray-400"
                        }`}
                      disabled={saving}
                    >
                      {t.multipleChoice}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <ListPlus size={20} className="text-[#483383]" />
                    {t.items}
                  </h4>
                  <button
                    onClick={handleAddItem}
                    className="text-xs font-bold text-[#483383] flex items-center gap-1 hover:underline"
                    disabled={saving}
                  >
                    <Plus size={14} /> {t.addItem}
                  </button>
                </div>

                <div className="space-y-3">
                  {form.items?.map((item: any, idx: number) => (
                    <div
                      key={item.id}
                      className="flex flex-col md:flex-row gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 group"
                    >
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">{t.labelEn}</label>
                        <input
                          type="text"
                          className="w-full bg-white border border-gray-100 rounded-xl p-3 text-xs outline-none focus:border-[#483383]"
                          value={item.labelEn || ""}
                          onChange={(e) => handleItemChange(idx, "labelEn", e.target.value)}
                          disabled={saving}
                        />
                      </div>

                      <div className="flex-1 space-y-1 text-right">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">{t.labelAr}</label>
                        <input
                          type="text"
                          className="w-full bg-white border border-gray-100 rounded-xl p-3 text-xs outline-none focus:border-[#483383] text-right"
                          value={item.labelAr || ""}
                          onChange={(e) => handleItemChange(idx, "labelAr", e.target.value)}
                          disabled={saving}
                        />
                      </div>

                      <div className="w-full md:w-32 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">
                          {t.price} ({t.currency})
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          className="w-full bg-white border border-gray-100 rounded-xl p-3 text-xs outline-none focus:border-[#483383]"
                          value={Number(item.price || 0)}
                          onChange={(e) => handleItemChange(idx, "price", Number(e.target.value))}
                          disabled={saving}
                        />
                      </div>

                      <div className="md:pt-5">
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="p-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-60"
                          disabled={saving}
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-10 py-8 border-t border-gray-100 flex gap-4 shrink-0 bg-gray-50/30">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-4 font-bold text-gray-500 bg-white border border-gray-100 rounded-2xl active:scale-95 transition-all"
                disabled={saving}
              >
                {t.cancel}
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-4 font-bold text-white bg-[#483383] rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                <span>{saving ? (lang === "ar" ? "جارٍ الحفظ..." : "Saving...") : t.save}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ChevronRight = ({ size, className }: { size: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default ServiceAddonsModule;
