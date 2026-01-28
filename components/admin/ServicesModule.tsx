import React, { useMemo, useState } from "react";
import { Plus, Edit, Trash2, Search, AlertTriangle, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { translations, Locale } from "../../services/i18n";
import { useServices } from "./services/useServices";
import { toast } from "sonner";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";

interface ServicesModuleProps {
  lang: Locale;
}

// ✅ Popup Component (in same file)
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
              <h3 className="text-base font-bold text-gray-900">{title}</h3>
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

        {/* RTL comfort */}
        <div className="sr-only" dir={lang === "ar" ? "rtl" : "ltr"} />
      </div>
    </div>
  );
}

const ServicesModule: React.FC<ServicesModuleProps> = ({ lang }) => {
  const navigate = useNavigate();
  const t = translations[lang];

  const perPage = 1000;
  const { isLoading, uiRows } = useServices(lang, perPage);

  const [searchTerm, setSearchTerm] = useState("");
  const [localRows, setLocalRows] = useState<any[] | null>(null);

  // ✅ modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name?: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ✅ source of truth for rendering
  const rowsToRender = localRows ?? uiRows;

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rowsToRender;
    return rowsToRender.filter((s) => (s.name || "").toLowerCase().includes(q));
  }, [rowsToRender, searchTerm]);

  // ✅ DELETE /services/:id (same file)
  const deleteService = async (id: number) => {
    const res = await fetch(`${DASHBOARD_API_BASE_URL}/services/${id}`, {
      method: "DELETE",
      headers: {
        lang,
        Accept: "application/json",
        // Authorization: `Bearer ${token}`,
        // secretKey: "....",
      } as any,
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    const ok = res.ok && (data?.status === undefined ? true : !!data?.status);
    const msg =
      data?.message ||
      (ok
        ? lang === "ar"
          ? "تم حذف الخدمة"
          : "Service deleted"
        : lang === "ar"
          ? "فشل حذف الخدمة"
          : "Failed to delete service");

    if (!ok) throw new Error(msg);
    return { ok, msg };
  };

  // ✅ open modal instead of confirm()
  const openDeleteModal = (svc: any) => {
    setDeleteTarget({ id: svc.id, name: svc.name });
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const id = deleteTarget.id;

    // optimistic UI
    const prev = rowsToRender;
    setLocalRows(prev.filter((x) => x.id !== id));

    setDeleteLoading(true);
    try {
      const { msg } = await deleteService(id);

      toast(msg, {
        style: { background: "#198754", color: "#fff", borderRadius: "10px" },
      });

      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (e: any) {
      // rollback
      setLocalRows(prev);

      toast(e?.message || (lang === "ar" ? "فشل حذف الخدمة" : "Failed to delete service"), {
        style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-auto">
        <div className="h-12 bg-gray-50 border-b border-gray-100" />
        <div className="p-6 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-gray-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ✅ Popup */}
      <ConfirmDeleteModal
        open={deleteModalOpen}
        lang={lang}
        loading={deleteLoading}
        title={lang === "ar" ? "تأكيد الحذف" : "Confirm deletion"}
        description={
          lang === "ar"
            ? `هل أنت متأكد أنك تريد حذف الخدمة: "${deleteTarget?.name ?? ""}"؟ لا يمكن التراجع عن هذا الإجراء.`
            : `Are you sure you want to delete "${deleteTarget?.name ?? ""}"? This action cannot be undone.`
        }
        confirmText={lang === "ar" ? "نعم، احذف" : "Yes, delete"}
        cancelText={lang === "ar" ? "إلغاء" : "Cancel"}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            className={`w-full ${lang === "ar" ? "pr-11 pl-4" : "pl-11 pr-4"
              } py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all`}
            placeholder={t.searchServices}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search
            className={`absolute ${lang === "ar" ? "right-4" : "left-4"
              } top-1/2 -translate-y-1/2 text-gray-400`}
            size={18}
          />
        </div>

        <button
          onClick={() => navigate("/admin/services/new")}
          className="bg-[#483383] text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-lg shadow-[#483383]/20"
        >
          <Plus size={20} />
          <span>{t.addService}</span>
        </button>
      </div>

      {isLoading ? (
        renderSkeleton()
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-auto">
          <table className="w-full text-start">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">
                  {t.service}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">
                  {t.price}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">
                  {t.duration}
                </th>
                <th
                  className={`px-6 py-4 text-xs font-semibold text-gray-400 uppercase ${lang === "ar" ? "text-start" : "text-end"
                    }`}
                >
                  {t.actions}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {filtered.map((svc) => (
                <tr key={svc.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={svc.image || ""}
                        className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                        alt={svc.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "data:image/svg+xml;charset=UTF-8," +
                            encodeURIComponent(
                              `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>
  <rect width='100%' height='100%' fill='#f3f4f6'/>
  <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-size='12'>IMG</text>
</svg>`
                            );
                        }}
                      />

                      <div>
                        <p className="font-semibold text-gray-900">{svc.name}</p>
                        <p className="text-[10px] text-gray-400 truncate max-w-[200px]">
                          {svc.description}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-semibold text-[#483383]">{svc.price}</td>

                  <td className="px-6 py-4 text-sm text-gray-500">{svc.duration}</td>

                  <td className={`px-6 py-4 ${lang === "ar" ? "text-start" : "text-end"}`}>
                    <div
                      className={`flex items-center gap-2 ${lang === "ar" ? "justify-start" : "justify-end"
                        }`}
                    >
                      <button
                        onClick={() => {
                          localStorage.setItem('editServiceData', JSON.stringify(svc));
                          navigate(`/admin/services/${svc.id}/edit`);
                        }}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                        title={t.edit}
                      >
                        <Edit size={18} />
                      </button>

                      <button
                        onClick={() => openDeleteModal(svc)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title={t.delete}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400">
                    {t.noResults ?? "لا توجد نتائج"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ServicesModule;
