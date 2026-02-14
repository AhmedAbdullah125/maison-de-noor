import React, { useState, useEffect } from 'react';
import { translations, Locale } from '../../services/i18n';
import { Plus, Search, Edit, Trash2, Check, X, Image as ImageIcon, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL, DASHBOARD_API_BASE_URL } from '@/lib/apiConfig';

interface PaymentMethod {
    id: number;
    name_ar: string;
    name_en: string;
    code: string;
    icon: string;
    is_active: boolean; // boolean from API
    sort_order: number;
}

interface PaymentMethodsProps {
    lang: Locale;
}

const PaymentMethods: React.FC<PaymentMethodsProps> = ({ lang }) => {
    const t = translations[lang];
    const [loading, setLoading] = useState(true);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        name_ar: '',
        name_en: '',
        is_active: true,
        iconFile: null as File | null,
        iconPreview: ''
    });

    // Fetch Payment Methods
    const fetchPaymentMethods = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${DASHBOARD_API_BASE_URL}/payment-methods`, {
                headers: {
                    'Accept': 'application/json',
                    'lang': lang
                }
            });
            const data = await response.json();

            if (data.status && data.data && Array.isArray(data.data.data)) {
                setPaymentMethods(data.data.data);
            } else {
                if (data.status && Array.isArray(data.data)) {
                    setPaymentMethods(data.data);
                } else {
                    setPaymentMethods([]);
                }
            }

        } catch (error) {
            console.error('Error fetching payment methods:', error);
            toast.error(lang === 'ar' ? 'فشل في تحميل طرق الدفع' : 'Failed to fetch payment methods');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPaymentMethods();
    }, [lang]);

    const resetForm = () => {
        setFormData({
            name_ar: '',
            name_en: '',
            is_active: true,
            iconFile: null,
            iconPreview: ''
        });
        setEditingId(null);
        setIsModalOpen(false);
    };

    const handleAdd = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleEdit = async (method: PaymentMethod) => {
        setEditingId(method.id);
        setIsModalOpen(true);
        // Optimistically set data from list first
        setFormData({
            name_ar: method.name_ar,
            name_en: method.name_en,
            is_active: method.is_active,
            code: method.code,
            iconFile: null,
            iconPreview: method.icon
        });

        // Fetch fresh data
        try {
            const response = await fetch(`${DASHBOARD_API_BASE_URL}/payment-methods/${method.id}`, {
                headers: {
                    'Accept': 'application/json',
                    'lang': lang
                }
            });
            const res = await response.json();
            if (res.status && res.data) {
                const item = res.data;
                setFormData({
                    name_ar: item.name_ar,
                    name_en: item.name_en,
                    code: item.code,
                    is_active: item.is_active ? 1 : 0,
                    iconFile: null,
                    iconPreview: item.icon
                });
            }
        } catch (error) {
            console.error('Error fetching single payment method:', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const preview = URL.createObjectURL(file);
            setFormData(prev => ({
                ...prev,
                iconFile: file,
                iconPreview: preview
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name_ar || !formData.name_en) {
            toast.error(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
            return;
        }

        try {
            setSaving(true);
            const fd = new FormData();
            fd.append('name_ar', formData.name_ar);
            fd.append('name_en', formData.name_en);
            fd.append('is_active', formData.is_active ? '1' : '0');

            if (formData.iconFile) {
                fd.append('icon', formData.iconFile);
            }
            fd.append('code', formData.code);

            let url = `${DASHBOARD_API_BASE_URL}/payment-methods`;
            if (editingId) {
                url = `${DASHBOARD_API_BASE_URL}/payment-methods/${editingId}`;
                fd.append('_method', 'PUT');
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'lang': lang
                },
                body: fd
            });

            const result = await response.json();

            if (result.status) {
                toast.success(result.message || (editingId ? (lang === 'ar' ? 'تم التحديث بنجاح' : 'Updated successfully') : (lang === 'ar' ? 'تمت الإضافة بنجاح' : 'Added successfully')));
                fetchPaymentMethods();
                resetForm();
            } else {
                toast.error(result.message || (lang === 'ar' ? 'فشل العملية' : 'Operation failed'));
            }

        } catch (error) {
            console.error('Error saving payment method:', error);
            toast.error(lang === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'An error occurred while saving');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (method: PaymentMethod, currentStatus: boolean) => {
        // Optimistic update
        const newStatus = !currentStatus;
        setPaymentMethods(prev => prev.map(m => m.id === method.id ? { ...m, is_active: newStatus } : m));

        try {
            const fd = new FormData();
            fd.append('_method', 'PUT');
            fd.append('is_active', newStatus ? '1' : '0');
            fd.append('name_ar', method.name_ar);
            fd.append('name_en', method.name_en);
            fd.append('code', method.code);

            const response = await fetch(`${DASHBOARD_API_BASE_URL}/payment-methods/${method.id}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'lang': lang
                },
                body: fd
            });

            const result = await response.json();

            if (!result.status) {
                // Revert if failed
                setPaymentMethods(prev => prev.map(m => m.id === id ? { ...m, is_active: currentStatus } : m));
                toast.error(result.message || (lang === 'ar' ? 'فشل تحديث الحالة' : 'Failed to update status'));
            } else {
                toast.success(result.message || (lang === 'ar' ? 'تم تحديث الحالة بنجاح' : 'Status updated successfully'));
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            // Revert if error
            setPaymentMethods(prev => prev.map(m => m.id === id ? { ...m, is_active: currentStatus } : m));
            toast.error(lang === 'ar' ? 'حدث خطأ أثناء تحديث الحالة' : 'An error occurred while updating status');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t.deletePaymentMethodConfirm)) return;

        try {
            const response = await fetch(`${DASHBOARD_API_BASE_URL}/payment-methods/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'lang': lang
                }
            });
            const result = await response.json();

            if (result.status) {
                toast.success(result.message);
                fetchPaymentMethods();
            } else {
                toast.error(result.message || 'Failed to delete');
            }
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Error deleting payment method');
        }
    }

    const filteredMethods = paymentMethods.filter(method =>
        method.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        method.name_ar.includes(searchQuery) ||
        method.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && paymentMethods.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t.paymentsMethods}</h1>
                    <p className="text-gray-500 mt-1">{lang === 'ar' ? 'إدارة طرق الدفع في النظام' : 'Manage payment methods in the system'}</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-[#483383] text-white px-4 py-2 rounded-xl hover:bg-[#342461] transition-colors"
                >
                    <Plus size={20} />
                    {t.addPaymentMethod}
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder={t.searchPaymentMethods}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#483383]/20 focus:border-[#483383]"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                        <thead className="bg-[#f8f9fa] border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-start text-sm font-semibold text-gray-600">{t.icon}</th>
                                <th className="px-6 py-4 text-start text-sm font-semibold text-gray-600">{t.name} (EN)</th>
                                <th className="px-6 py-4 text-start text-sm font-semibold text-gray-600">{t.name} (AR)</th>
                                <th className="px-6 py-4 text-start text-sm font-semibold text-gray-600">{t.code}</th>
                                <th className="px-6 py-4 text-start text-sm font-semibold text-gray-600">{t.status}</th>
                                <th className="px-6 py-4 text-start text-sm font-semibold text-gray-600">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredMethods.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        {t.noContentYet}
                                    </td>
                                </tr>
                            ) : (
                                filteredMethods.map((method) => (
                                    <tr key={method.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            {method.icon ? (
                                                <img
                                                    src={method.icon}
                                                    alt={method.name_en}
                                                    className="w-10 h-10 object-contain rounded-lg border border-gray-100 bg-white"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                                    <ImageIcon size={20} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{method.name_en}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{method.name_ar}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded w-fit">{method.code}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(method, method.is_active,)}
                                                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#483383]/20 ${method.is_active ? 'bg-[#483383]' : 'bg-gray-200'
                                                    }`}
                                            >
                                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${method.is_active ? 'translate-x-6' : 'translate-x-0'
                                                    }`} />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(method)}
                                                    title={t.edit}
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(method.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title={t.delete}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingId ? (lang === 'ar' ? 'تعديل طريقة الدفع' : 'Edit Payment Method') : t.addPaymentMethod}
                            </h3>
                            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Icon Upload */}
                            <div className="flex justify-center">
                                <div className="relative group cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                    />
                                    <div className={`w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${formData.iconPreview ? 'border-[#483383] bg-white' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                                        }`}>
                                        {formData.iconPreview ? (
                                            <img src={formData.iconPreview} alt="Icon Preview" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 text-gray-400">
                                                <Upload size={24} />
                                                <span className="text-xs font-medium">{t.icon}</span>
                                            </div>
                                        )}
                                    </div>
                                    {formData.iconPreview && (
                                        <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md z-20 cursor-pointer" onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setFormData(prev => ({ ...prev, iconFile: null, iconPreview: '' }));
                                        }}>
                                            <X size={14} className="text-red-500" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {lang === 'ar' ? 'الاسم (بالعربي)' : 'Name (Arabic)'} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name_ar}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#483383]/20 focus:border-[#483383]"
                                        dir="rtl"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {lang === 'ar' ? 'الاسم (بالإنجليزي)' : 'Name (English)'} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name_en}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#483383]/20 focus:border-[#483383]"
                                        dir="ltr"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {lang === 'ar' ? 'الكود' : 'Code'} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#483383]/20 focus:border-[#483383]"
                                        dir="ltr"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                                        className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${formData.is_active ? 'bg-[#483383]' : 'bg-gray-200'
                                            }`}
                                    >
                                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${formData.is_active ? 'translate-x-6' : 'translate-x-0'
                                            }`} />
                                    </button>
                                    <span className="text-sm font-medium text-gray-700">
                                        {formData.is_active ? t.active : t.inactive}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-6">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 text-white bg-[#483383] hover:bg-[#342461] rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    {t.save}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentMethods;
