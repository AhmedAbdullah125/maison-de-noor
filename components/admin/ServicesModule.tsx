import React, { useMemo, useState } from "react";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { translations, Locale } from "../../services/i18n";
import { useServices } from "./services/useServices";

interface ServicesModuleProps {
  lang: Locale;
}

const ServicesModule: React.FC<ServicesModuleProps> = ({ lang }) => {
  const navigate = useNavigate();
  const t = translations[lang];

  const perPage = 1000;
  const { isLoading, uiRows, remove } = useServices(lang, perPage);

  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return uiRows;
    return uiRows.filter((s) => (s.name || "").toLowerCase().includes(q));
  }, [uiRows, searchTerm]);

  const handleDelete = async (id: number) => {
    if (confirm(t.confirmDelete)) {
      await remove(id); // ✅ API delete + optimistic
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            className={`w-full ${lang === "ar" ? "pr-11 pl-4" : "pl-11 pr-4"} py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all`}
            placeholder={t.searchServices}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search
            className={`absolute ${lang === "ar" ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-gray-400`}
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
                <th className={`px-6 py-4 text-xs font-semibold text-gray-400 uppercase ${lang === "ar" ? "text-start" : "text-end"}`}>
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

                  <td className="px-6 py-4 font-semibold text-[#483383]">
                    {svc.price}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {svc.duration}
                  </td>

                  <td className={`px-6 py-4 ${lang === "ar" ? "text-start" : "text-end"}`}>
                    <div className={`flex items-center gap-2 ${lang === "ar" ? "justify-start" : "justify-end"}`}>
                      <button
                        onClick={() => navigate(`/admin/services/${svc.id}/edit`)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                        title={t.edit}
                      >
                        <Edit size={18} />
                      </button>

                      <button
                        onClick={() => handleDelete(svc.id)}
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
