import React, { useEffect, useState } from 'react';
import { CreditCard, Loader2, Plus, Edit2, Trash2, Search, AlertTriangle, X } from 'lucide-react';
import { translations, Locale } from '../../services/i18n';
import { getCoupons, deleteCoupon, CouponItem } from '../services/getCoupons';
import CouponModal from './coupons/CouponModal';
import { toast } from 'sonner';

// ✅ Popup Component
function ConfirmDeleteModal({
    open,
    lang,
    title,
    description,
    confirmText,
    cancelText,
    loading,
    onClose,
    onConfirm,
}: {
    open: boolean;
    lang: Locale;
    title: string;
    description: string;
    confirmText: string;
    cancelText: string;
    loading?: boolean;
    onClose: () => void;
    onConfirm: () => void;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                            <AlertTriangle size={22} />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
                        </div>
                    </div>

                    <button
                        onClick={loading ? undefined : onClose}
                        className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition"
                        aria-label="Close"
                        disabled={!!loading}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={!!loading}
                        className="w-full py-3 rounded-2xl bg-gray-50 text-gray-700 font-semibold hover:bg-gray-100 transition disabled:opacity-60"
                    >
                        {cancelText}
                    </button>

                    <button
                        onClick={onConfirm}
                        disabled={!!loading}
                        className="w-full py-3 rounded-2xl bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}



interface CouponsModuleProps {
    lang: Locale;
}

const CouponsModule: React.FC<CouponsModuleProps> = ({ lang }) => {
    const t = translations[lang];
    const [coupons, setCoupons] = useState<CouponItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);

    // Deletion Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<CouponItem | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [isActiveStatus, setIsActiveStatus] = useState<number>(1);


    useEffect(() => {
        fetchCoupons();
    }, [currentPage, lang, isActiveStatus]);

    const fetchCoupons = async () => {
        setLoading(true);
        const result = await getCoupons(lang, currentPage, 10, isActiveStatus);

        if (result.ok) {
            setCoupons(result.data);
            setTotalPages(result.pagination.meta.last_page);
        }
        setLoading(false);
    };

    const handleDelete = (coupon: CouponItem) => {
        setDeleteTarget(coupon);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        setDeleteLoading(true);
        const result = await deleteCoupon(deleteTarget.id, lang);
        setDeleteLoading(false);

        if (result.ok) {
            setDeleteModalOpen(false);
            setDeleteTarget(null);
            fetchCoupons();
        }
    };

    const closeDeleteModal = () => {
        if (deleteLoading) return;
        setDeleteModalOpen(false);
        setDeleteTarget(null);
    };

    const filteredCoupons = coupons.filter(coupon =>
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && coupons.length === 0) {
        return (
            <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">{t.coupons}</h2>
                </div>
                <div className="bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-sm flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#483383]" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <ConfirmDeleteModal
                open={deleteModalOpen}
                lang={lang}
                loading={deleteLoading}
                title={lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion'}
                description={
                    lang === 'ar'
                        ? `هل أنت متأكد أنك تريد حذف الكوبون: "${deleteTarget?.code ?? ""}"؟ لا يمكن التراجع عن هذا الإجراء.`
                        : `Are you sure you want to delete coupon "${deleteTarget?.code ?? ""}"? This action cannot be undone.`
                }
                confirmText={lang === 'ar' ? 'نعم، احذف' : 'Yes, Delete'}
                cancelText={lang === 'ar' ? 'إلغاء' : 'Cancel'}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-semibold text-gray-900">{t.coupons}</h2>
                    <div className="flex p-1 bg-gray-100/50 rounded-2xl border border-gray-100 w-fit mt-2">
                        <button
                            onClick={() => {
                                setIsActiveStatus(1);
                                setCurrentPage(1);
                            }}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${isActiveStatus === 1 ? "bg-white text-[#483383] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            {t.active}
                        </button>
                        <button
                            onClick={() => {
                                setIsActiveStatus(0);
                                setCurrentPage(1);
                            }}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${isActiveStatus === 0 ? "bg-white text-red-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            {t.inactive}
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#483383] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder={t.searchCoupons}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#483383]/10 focus:border-[#483383] transition-all text-sm"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingCoupon(null);
                            setModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#483383] text-white rounded-2xl hover:bg-[#382866] transition-all shadow-lg shadow-[#483383]/20 font-medium text-sm whitespace-nowrap"
                    >
                        <Plus size={18} />
                        <span>{t.addCoupon}</span>
                    </button>
                </div>
            </div>

            <CouponModal
                lang={lang}
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingCoupon(null);
                }}
                onSuccess={fetchCoupons}
                editingCoupon={editingCoupon}
            />


            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className={`text-start py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider ${lang === 'ar' ? 'pr-8' : 'pl-8'}`}>{t.code}</th>
                                <th className="text-start py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.discountValue}</th>
                                <th className="text-start py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.startDate}</th>
                                <th className="text-start py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.endDate}</th>
                                <th className="text-start py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.status}</th>
                                <th className="text-center py-5 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredCoupons.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                                <CreditCard size={32} />
                                            </div>
                                            <p className="text-gray-400 font-medium">{t.noContentYet}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCoupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className={`py-5 px-6 ${lang === 'ar' ? 'pr-8' : 'pl-8'}`}>
                                            <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg text-sm">{coupon.code}</span>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {coupon.discount_value} {coupon.discount_type === 'percentage' ? '%' : t.currency}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    {coupon.discount_type === 'percentage' ? t.percentage : t.fixed}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 text-sm text-gray-600">{coupon.start_date}</td>
                                        <td className="py-5 px-6 text-sm text-gray-600">{coupon.end_date}</td>
                                        <td className="py-5 px-6">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${coupon.is_active === 1
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {coupon.is_active === 1 ? t.active : t.inactive}
                                            </span>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingCoupon(coupon);
                                                        setModalOpen(true);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-[#483383] hover:bg-[#483383]/5 rounded-xl transition-all"
                                                >
                                                    <Edit2 size={16} />
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(coupon)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
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

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 py-6 bg-gray-50/30 border-t border-gray-100">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-5 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            {t.prev}
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">{currentPage}</span>
                            <span className="text-sm font-medium text-gray-400">{t.of}</span>
                            <span className="text-sm font-bold text-gray-900">{totalPages}</span>
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-5 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            {t.next}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CouponsModule;
