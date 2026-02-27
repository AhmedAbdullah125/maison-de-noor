import React, { useState, useEffect } from "react";
import { X, Loader2, Check } from "lucide-react";
import { Locale, translations } from "../../../services/i18n";
import { useCategoriesOptions } from "../categories/useCategoriesOptions";
import { useServices } from "../services/useServices";
import { addCoupon, updateCoupon, CouponItem } from "../../services/getCoupons";

interface CouponModalProps {
    lang: Locale;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingCoupon?: CouponItem | null;
}

const CouponModal: React.FC<CouponModalProps> = ({ lang, open, onClose, onSuccess, editingCoupon }) => {
    const t = translations[lang];
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        code: "",
        discount_type: "percentage" as "percentage" | "fixed",
        discount_value: "",
        start_date: "",
        end_date: "",
        is_active: 1,
        service_ids: [] as number[],
    });

    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

    const { isLoading: catsLoading, rows: categories } = useCategoriesOptions(lang);
    const { isLoading: servicesLoading, uiRows: allServices } = useServices(lang, 1000);

    useEffect(() => {
        if (open) {
            if (editingCoupon) {
                setForm({
                    code: editingCoupon.code,
                    discount_type: editingCoupon.discount_type,
                    discount_value: String(editingCoupon.discount_value),
                    start_date: editingCoupon.start_date,
                    end_date: editingCoupon.end_date,
                    is_active: editingCoupon.is_active,
                    service_ids: editingCoupon.services.map(s => s.id),
                });
            } else {
                setForm({
                    code: "",
                    discount_type: "percentage",
                    discount_value: "",
                    start_date: "",
                    end_date: "",
                    is_active: 1,
                    service_ids: [],
                });
            }
        }
    }, [open, editingCoupon]);

    if (!open) return null;

    const handleToggleService = (id: number) => {
        setForm(prev => ({
            ...prev,
            service_ids: prev.service_ids.includes(id)
                ? prev.service_ids.filter(sid => sid !== id)
                : [...prev.service_ids, id]
        }));
    };

    const handleSave = async () => {
        if (!form.code || !form.discount_value || !form.start_date || !form.end_date) {
            return;
        }

        setSaving(true);
        const data = {
            ...form,
            discount_value: Number(form.discount_value),
        };

        let res;
        if (editingCoupon) {
            res = await updateCoupon(editingCoupon.id, data, lang);
        } else {
            res = await addCoupon(data, lang);
        }

        setSaving(false);
        if (res.ok) {
            onSuccess();
            onClose();
        }
    };

    const filteredServices = activeCategoryId ? allServices.filter(s => s.categoryId === activeCategoryId) : allServices;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{editingCoupon ? t.edit : t.addCoupon}</h3>
                        <p className="text-sm text-gray-500">
                            {editingCoupon
                                ? (lang === 'ar' ? 'تعديل بيانات كود الخصم' : 'Edit discount code details')
                                : (lang === 'ar' ? 'إنشاء كود خصم جديد للخدمات' : 'Create a new discount code for services')}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 mx-1">{t.code}</label>
                            <input
                                type="text"
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383]/10 focus:border-[#483383] transition-all font-bold tracking-wider uppercase text-center"
                                value={form.code}
                                onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))}
                                placeholder="NOOR2026"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 mx-1">{t.discountType}</label>
                            <div className="flex p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
                                <button
                                    onClick={() => setForm(f => ({ ...f, discount_type: "percentage" }))}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${form.discount_type === "percentage" ? "bg-white text-[#483383] shadow-sm" : "text-gray-400"}`}
                                >
                                    {t.percentage}
                                </button>
                                <button
                                    onClick={() => setForm(f => ({ ...f, discount_type: "fixed" }))}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${form.discount_type === "fixed" ? "bg-white text-[#483383] shadow-sm" : "text-gray-400"}`}
                                >
                                    {t.fixed} ( {t.currency} )
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 mx-1">{t.discountValue}</label>
                            <input
                                type="number"
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383]/10 focus:border-[#483383] transition-all font-bold"
                                value={form.discount_value}
                                onChange={(e) => setForm(f => ({ ...f, discount_value: e.target.value }))}
                                placeholder="10"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 mx-1">{t.startDate}</label>
                            <input
                                type="date"
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383]/10 focus:border-[#483383] transition-all"
                                value={form.start_date}
                                onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 mx-1">{t.endDate}</label>
                            <input
                                type="date"
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383]/10 focus:border-[#483383] transition-all"
                                value={form.end_date}
                                onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 mx-1">{t.status}</label>
                            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                                <span className="text-sm font-medium text-gray-600">{form.is_active ? t.active : t.inactive}</span>
                                <button
                                    onClick={() => setForm(f => ({ ...f, is_active: f.is_active === 1 ? 0 : 1 }))}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${form.is_active === 1 ? 'bg-[#483383]' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${lang === 'ar' ? (form.is_active === 1 ? 'right-1' : 'right-7') : (form.is_active === 1 ? 'left-7' : 'left-1')}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Services Selection - Tabs */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mx-1">
                            <label className="text-sm font-bold text-gray-700">{lang === 'ar' ? 'اختيار الخدمات' : 'Select Services'}</label>
                            <span className="text-[10px] font-bold text-[#483383] bg-[#483383]/10 px-2 py-1 rounded-lg">
                                {form.service_ids.length} {lang === 'ar' ? 'خدمات مختارة' : 'Services Selected'}
                            </span>
                        </div>

                        {catsLoading ? (
                            <div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-[#483383]" /></div>
                        ) : (
                            <div className="space-y-6">
                                {/* Categories Tabs */}
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                                    <button
                                        onClick={() => setActiveCategoryId(null)}
                                        className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border ${activeCategoryId === null ? "bg-[#483383] text-white border-[#483383] shadow-md" : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"}`}
                                    >
                                        {lang === 'ar' ? 'الكل' : 'All'}
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategoryId(cat.id)}
                                            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border ${activeCategoryId === cat.id ? "bg-[#483383] text-white border-[#483383] shadow-md" : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"}`}
                                        >
                                            {lang === 'ar' ? cat.name_ar : cat.name_en}
                                        </button>
                                    ))}
                                </div>

                                {/* Services Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {servicesLoading ? (
                                        <div className="col-span-full h-20 flex items-center justify-center"><Loader2 className="animate-spin text-gray-300" /></div>
                                    ) : (
                                        filteredServices.map(svc => (
                                            Number(svc.price) === 0 ? null :
                                                <div
                                                    key={svc.id}
                                                    onClick={() => handleToggleService(svc.id)}
                                                    className={`p-4 rounded-[1.5rem] border-2 cursor-pointer transition-all flex items-center justify-between group ${form.service_ids.includes(svc.id) ? "border-[#483383] bg-[#483383]/5" : "border-gray-50 bg-gray-50/30 hover:border-gray-200"}`}
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <img src={svc.image} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="" />
                                                        <div className="overflow-hidden">
                                                            <p className="text-xs font-bold text-gray-900 leading-tight truncate">{svc.name}</p>
                                                            <p className="text-[10px] text-[#483383] font-bold mt-0.5">{svc.price} {t.currency}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all shrink-0 ${form.service_ids.includes(svc.id) ? "bg-[#483383] border-[#483383] text-white" : "border-gray-200 bg-white group-hover:border-[#483383]/50"}`}>
                                                        {form.service_ids.includes(svc.id) && <Check size={14} strokeWidth={4} />}
                                                    </div>
                                                </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex gap-4">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 py-4 font-bold text-gray-500 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all font-semibold"
                    >
                        {t.cancel}
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving || !form.code || !form.discount_value}
                        className="flex-[2] py-4 font-bold text-white bg-[#483383] rounded-2xl shadow-lg shadow-[#483383]/20 hover:bg-[#382866] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {saving && <Loader2 size={20} className="animate-spin" />}
                        {saving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : t.save}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CouponModal;
