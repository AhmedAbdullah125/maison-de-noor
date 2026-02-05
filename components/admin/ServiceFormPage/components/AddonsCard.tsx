import React, { useState } from "react";
import { LayoutGrid, ChevronDown, Plus, X, Save, Loader2, ListPlus, Trash, Copy, Edit, Trash2 } from "lucide-react";
import { Locale } from "../../../../services/i18n";
import { toast } from "sonner";
import { http } from "../../../services/http";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";
import { GlobalAddon, GlobalAddonItem } from "../../services/useOptionsOptions";

// Helper to convert to number
const toNum = (x: any) => {
    const n = Number.parseFloat(String(x ?? "0"));
    return Number.isFinite(n) ? n : 0;
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

function buildOptionFormData(args: { form: Partial<GlobalAddon>; mode: "create" | "edit" }) {
    const { form, mode } = args;
    const fd = new FormData();

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

async function deleteOption(params: { lang: Locale; id: string | number }) {
    const res = await http.delete(`${DASHBOARD_API_BASE_URL}/options/${params.id}`, {
        headers: { lang: params.lang, Accept: "application/json" },
    });

    const ok = !!res?.data?.status;
    toastApi(ok, res?.data?.message || (ok ? "Deleted" : "Failed"));
    if (!ok) throw new Error(res?.data?.message || "Failed");
    return res.data;
}

export default function AddonsCard({
    lang,
    t,
    expanded,
    onToggleExpanded,
    optionsLoading,
    options,
    selectedOptionIds,
    onToggleOption,
    onReload,
}: {
    lang: Locale;
    t: any;
    expanded: boolean;
    onToggleExpanded: () => void;
    optionsLoading: boolean;
    options: any[];
    selectedOptionIds: number[];
    onToggleOption: (id: number) => void;
    onReload?: () => void;
}) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingAddon, setEditingAddon] = useState<GlobalAddon | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | number | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [addonToDelete, setAddonToDelete] = useState<GlobalAddon | null>(null);
    const [form, setForm] = useState<Partial<GlobalAddon>>({
        titleEn: "",
        titleAr: "",
        required: false,
        selectionType: "single",
        items: [{ id: "1", labelEn: "", labelAr: "", price: 0 }],
    });

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

    const handleSave = async () => {
        try {
            setSaving(true);

            if (editingAddon) {
                await updateOption({ lang, id: editingAddon.id, form });
            } else {
                await createOption({ lang, form });
            }

            // Reload the options list if callback provided
            if (onReload) {
                await onReload();
            }

            setModalOpen(false);
        } catch (e: any) {
            toast(e?.message || (lang === "ar" ? "حدث خطأ" : "Something went wrong"), {
                style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDuplicate = async (addon: GlobalAddon, e: React.MouseEvent) => {
        e.stopPropagation();
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

            if (onReload) {
                await onReload();
            }

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

    const handleDelete = (addon: GlobalAddon, e: React.MouseEvent) => {
        e.stopPropagation();
        setAddonToDelete(addon);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!addonToDelete) return;

        try {
            setDeletingId(addonToDelete.id);
            await deleteOption({ lang, id: addonToDelete.id });

            if (onReload) {
                await onReload();
            }

            setDeleteModalOpen(false);
            setAddonToDelete(null);
        } catch (e: any) {
            toast(e?.message || (lang === "ar" ? "فشل الحذف" : "Delete failed"), {
                style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
            });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden transition-all">
            <div
                className="p-8 flex items-center justify-between cursor-pointer hover:bg-gray-50/30 transition-colors"
                onClick={onToggleExpanded}
            >
                <div className="flex items-center gap-3">
                    <LayoutGrid size={20} className="text-[#483383]" />
                    <h3 className="text-base font-semibold text-gray-900">{t.serviceAddons}</h3>
                    <span className="text-[10px] font-semibold text-white bg-[#483383] px-2 py-0.5 rounded-lg ml-2">
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

                    {/* Add New Addon Button */}
                    <div className="mb-6">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal();
                            }}
                            className="bg-[#483383] text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-lg shadow-[#483383]/20 active:scale-95 transition-all text-sm"
                        >
                            <Plus size={18} />
                            <span>{t.addAddon}</span>
                        </button>
                    </div>

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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {options
                                .slice()
                                .sort((a, b) => {
                                    const aSelected = selectedOptionIds.includes(a.id);
                                    const bSelected = selectedOptionIds.includes(b.id);
                                    // Selected items first
                                    if (aSelected && !bSelected) return -1;
                                    if (!aSelected && bSelected) return 1;
                                    return 0;
                                })
                                .map((addon, index, array) => {
                                    const isSelected = selectedOptionIds.includes(addon.id);

                                    // Check if this is the first unselected item after selected items
                                    const isFirstUnselected = !isSelected && index > 0 && selectedOptionIds.includes(array[index - 1].id);
                                    const hasSelectedItems = selectedOptionIds.length > 0;
                                    const hasUnselectedItems = options.some(opt => !selectedOptionIds.includes(opt.id));

                                    return (
                                        <React.Fragment key={addon.id}>
                                            {isFirstUnselected && hasSelectedItems && hasUnselectedItems && (
                                                <div className="col-span-full">
                                                    <div className="relative py-6">
                                                        <div className="absolute inset-0 flex items-center">
                                                            <div className="w-full border-t border-gray-200"></div>
                                                        </div>
                                                        <div className="relative flex justify-center">
                                                            <span className="bg-white px-6 py-2 text-sm font-semibold text-gray-500 rounded-full border border-gray-200">
                                                                {lang === "ar" ? "اضافات اخري يمكن اختيارها" : "Other Available Options"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <div
                                                key={addon.id}
                                                onClick={() => onToggleOption(addon.id)}
                                                className={`bg-white rounded-[2.5rem] p-8 shadow-sm transition-all cursor-pointer flex flex-col group ${isSelected
                                                    ? "border-2 border-[#483383] shadow-md"
                                                    : "border border-gray-100 hover:shadow-md"
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <h3 className="text-base font-semibold text-gray-900">
                                                            {lang === "ar" ? addon.titleAr : addon.titleEn}
                                                        </h3>
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            <span
                                                                className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded-lg border ${addon.required
                                                                    ? "bg-red-50 text-red-500 border-red-100"
                                                                    : "bg-green-50 text-green-600 border-green-100"
                                                                    }`}
                                                            >
                                                                {addon.required ? t.required : t.optional}
                                                            </span>
                                                            <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-lg bg-violet-50 text-[#483383] border border-violet-100">
                                                                {addon.selectionType === "single" ? t.singleChoice : t.multipleChoice}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => handleDuplicate(addon, e)}
                                                            className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all"
                                                            title={t.duplicate}
                                                            disabled={deletingId === addon.id}
                                                        >
                                                            {deletingId === addon.id ? <Loader2 className="animate-spin" size={16} /> : <Copy size={16} />}
                                                        </button>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenModal(addon);
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                                            title={t.edit}
                                                        >
                                                            <Edit size={16} />
                                                        </button>

                                                        <button
                                                            onClick={(e) => handleDelete(addon, e)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-60"
                                                            title={t.delete}
                                                            disabled={deletingId === addon.id}
                                                        >
                                                            {deletingId === addon.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 mb-8">
                                                    {addon.items.slice(0, 3).map((item: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between items-center text-xs">
                                                            <span className="text-gray-500 font-normal">
                                                                {lang === "ar" ? item.labelAr : item.labelEn}
                                                            </span>
                                                            <span className="text-gray-900 font-semibold text-nowrap">
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
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                        </div>
                    )
                    }
                </div>
            )}

            {/* Add/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]">
                        <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <h3 className="text-xl font-semibold text-gray-900">{editingAddon ? t.editAddon : t.addAddon}</h3>
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
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{t.titleEn}</label>
                                    <input
                                        type="text"
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all"
                                        value={form.titleEn || ""}
                                        onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2 text-right">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{t.titleAr}</label>
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
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-1">{t.required}</label>
                                    <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl w-fit">
                                        <button
                                            onClick={() => setForm({ ...form, required: true })}
                                            className={`px-6 py-2.5 rounded-xl text-xs font-semibold transition-all ${form.required ? "bg-[#483383] text-white" : "text-gray-400"
                                                }`}
                                            disabled={saving}
                                        >
                                            {t.required}
                                        </button>
                                        <button
                                            onClick={() => setForm({ ...form, required: false })}
                                            className={`px-6 py-2.5 rounded-xl text-xs font-semibold transition-all ${!form.required ? "bg-white shadow-sm text-gray-900 border border-gray-100" : "text-gray-400"
                                                }`}
                                            disabled={saving}
                                        >
                                            {t.optional}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-1">{t.selectionType}</label>
                                    <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl w-fit">
                                        <button
                                            onClick={() => setForm({ ...form, selectionType: "single" })}
                                            className={`px-6 py-2.5 rounded-xl text-xs font-semibold transition-all ${form.selectionType === "single" ? "bg-[#483383] text-white" : "text-gray-400"
                                                }`}
                                            disabled={saving}
                                        >
                                            {t.singleChoice}
                                        </button>
                                        <button
                                            onClick={() => setForm({ ...form, selectionType: "multiple" })}
                                            className={`px-6 py-2.5 rounded-xl text-xs font-semibold transition-all ${form.selectionType === "multiple" ? "bg-[#483383] text-white" : "text-gray-400"
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
                                    <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                        <ListPlus size={20} className="text-[#483383]" />
                                        {t.items}
                                    </h4>
                                </div>

                                <div className="space-y-3">
                                    {form.items?.map((item: any, idx: number) => (
                                        <div
                                            key={item.id}
                                            className="flex flex-col md:flex-row gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 group"
                                        >
                                            <div className="flex-1 space-y-1">
                                                <label className="text-[10px] font-semibold text-gray-400 uppercase">{t.labelEn}</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white border border-gray-100 rounded-xl p-3 text-xs outline-none focus:border-[#483383]"
                                                    value={item.labelEn || ""}
                                                    onChange={(e) => handleItemChange(idx, "labelEn", e.target.value)}
                                                    disabled={saving}
                                                />
                                            </div>

                                            <div className="flex-1 space-y-1 text-right">
                                                <label className="text-[10px] font-semibold text-gray-400 uppercase">{t.labelAr}</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white border border-gray-100 rounded-xl p-3 text-xs outline-none focus:border-[#483383] text-right"
                                                    value={item.labelAr || ""}
                                                    onChange={(e) => handleItemChange(idx, "labelAr", e.target.value)}
                                                    disabled={saving}
                                                />
                                            </div>

                                            <div className="w-full md:w-32 space-y-1">
                                                <label className="text-[10px] font-semibold text-gray-400 uppercase">
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
                                    <button
                                        onClick={handleAddItem}
                                        className="text-xs font-semibold text-[#483383] flex items-center gap-1 hover:underline"
                                        disabled={saving}
                                    >
                                        <Plus size={14} /> {t.addItem}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="px-10 py-8 border-t border-gray-100 flex gap-4 shrink-0 bg-gray-50/30">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="flex-1 py-4 font-semibold text-gray-500 bg-white border border-gray-100 rounded-2xl active:scale-95 transition-all"
                                disabled={saving}
                            >
                                {t.cancel}
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-4 font-semibold text-white bg-[#483383] rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                <span>{saving ? (lang === "ar" ? "جارٍ الحفظ..." : "Saving...") : t.save}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn">
                        <div className="px-10 py-8 border-b border-gray-100">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {lang === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
                            </h3>
                        </div>

                        <div className="p-10">
                            <p className="text-gray-600">
                                {lang === "ar"
                                    ? `هل أنت متأكد من حذف "${addonToDelete?.titleAr}"؟`
                                    : `Are you sure you want to delete "${addonToDelete?.titleEn}"?`
                                }
                            </p>
                        </div>

                        <div className="px-10 py-8 border-t border-gray-100 flex gap-4 bg-gray-50/30">
                            <button
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setAddonToDelete(null);
                                }}
                                className="flex-1 py-4 font-semibold text-gray-500 bg-white border border-gray-100 rounded-2xl active:scale-95 transition-all"
                                disabled={!!deletingId}
                            >
                                {t.cancel}
                            </button>

                            <button
                                onClick={confirmDelete}
                                disabled={!!deletingId}
                                className="flex-1 py-4 font-semibold text-white bg-red-500 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {deletingId ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                                <span>{deletingId ? (lang === "ar" ? "جارٍ الحذف..." : "Deleting...") : t.delete}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
