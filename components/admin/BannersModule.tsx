import React, { useEffect, useState } from 'react';
import { LayoutGrid, Loader2, Plus, Edit2, Trash2, AlertTriangle, X } from 'lucide-react';
import { translations, Locale } from '../../services/i18n';
import { ApiBanner, getBanners, deleteBanner } from './banners/banners.api';
import BannerModal from './banners/BannerModal';

// ──────────────────────────────────────────
// Confirm Delete Modal
// ──────────────────────────────────────────
function ConfirmDeleteModal({
  open,
  lang,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  lang: Locale;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  const isRtl = lang === 'ar';
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {isRtl ? 'تأكيد الحذف' : 'Confirm Deletion'}
              </h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                {isRtl
                  ? 'هل أنتِ متأكدة من حذف هذا البانر؟ لا يمكن التراجع عن هذا الإجراء.'
                  : 'Are you sure you want to delete this banner? This action cannot be undone.'}
              </p>
            </div>
          </div>
          <button
            onClick={loading ? undefined : onClose}
            className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition"
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
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            disabled={!!loading}
            className="w-full py-3 rounded-2xl bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {isRtl ? 'نعم، احذف' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Main Module
// ──────────────────────────────────────────
interface BannersModuleProps {
  lang: Locale;
}

const BannersModule: React.FC<BannersModuleProps> = ({ lang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const [banners, setBanners] = useState<ApiBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiBanner | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiBanner | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, [currentPage, lang]);

  const fetchBanners = async () => {
    setLoading(true);
    const result = await getBanners(lang, currentPage, 10);
    if (result.ok) {
      setBanners(result.data);
      setTotalPages(result.meta.last_page);
    }
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (banner: ApiBanner) => {
    setEditing(banner);
    setModalOpen(true);
  };

  const handleDelete = (banner: ApiBanner) => {
    setDeleteTarget(banner);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const result = await deleteBanner(deleteTarget.id, lang);
    setDeleteLoading(false);
    if (result.ok) {
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchBanners();
    }
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  // ── Loading skeleton ──
  if (loading && banners.length === 0) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {isRtl ? 'البانرات' : 'Banners'}
          </h2>
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
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
      />

      <BannerModal
        lang={lang}
        open={modalOpen}
        editing={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSuccess={fetchBanners}
      />

      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {isRtl ? 'البانرات' : 'Banners'}
        </h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#483383] text-white rounded-2xl hover:bg-[#382866] transition-all shadow-lg shadow-[#483383]/20 font-medium text-sm whitespace-nowrap"
        >
          <Plus size={18} />
          <span>{isRtl ? 'إضافة بانر' : 'Add Banner'}</span>
        </button>
      </div>

      {/* Grid */}
      {banners.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
            <LayoutGrid size={32} />
          </div>
          <p className="text-gray-400 font-medium">{t.noContentYet}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {banners.map(banner => (
            <div
              key={banner.id}
              className="bg-white rounded-[1.75rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="relative h-40 bg-gray-100 overflow-hidden">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" fill="%23e5e7eb"><rect width="200" height="200"/></svg>';
                  }}
                />
                {/* Active badge */}
                <span
                  className={`absolute top-3 ${isRtl ? 'left-3' : 'right-3'} px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    banner.is_active === 1
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {banner.is_active === 1 ? t.active : t.inactive}
                </span>
              </div>

              {/* Info */}
              <div className="p-4 flex-1 flex flex-col gap-2">
                <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                  {banner.title}
                </p>
                {banner.url && (
                  <p className="text-[11px] text-[#483383] font-medium truncate">
                    {banner.url}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {isRtl ? 'الترتيب' : 'Position'}: {banner.position}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 flex items-center gap-2">
                <button
                  onClick={() => openEdit(banner)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[#483383] bg-[#483383]/5 hover:bg-[#483383]/10 transition-all text-xs font-semibold"
                >
                  <Edit2 size={14} />
                  {t.edit}
                </button>
                <button
                  onClick={() => handleDelete(banner)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 transition-all text-xs font-semibold"
                >
                  <Trash2 size={14} />
                  {t.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-4">
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
  );
};

export default BannersModule;
