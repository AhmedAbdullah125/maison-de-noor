"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { translations, Locale } from "../../services/i18n";
import {
  BookingType,
  BookingStatus,
  changeBookingStatus,
  toastApi,
} from "./bookings/bookings.api";
import { useBookings } from "./bookings/useBookings";

interface BookingsModuleProps {
  type: BookingType;
  lang: Locale;
}

function statusLabel(status: BookingStatus, lang: Locale, t: any) {
  // لو عندك keys جاهزة في translations استخدمها بدل ده
  if (lang === "ar") {
    if (status === "upcoming") return "قادمة";
    if (status === "completed") return "مكتملة";
    return "ملغاة";
  }
  if (status === "upcoming") return "Upcoming";
  if (status === "completed") return "Completed";
  return "Canceled";
}

function statusBadgeClass(status: BookingStatus) {
  if (status === "completed") return "bg-green-50 text-green-600";
  if (status === "canceled") return "bg-red-50 text-red-600";
  return "bg-amber-50 text-amber-700"; // upcoming
}

const BookingsModule: React.FC<BookingsModuleProps> = ({ type, lang }) => {
  const t = translations[lang];
  const perPage = 10;

  const { isLoading, apiRows, meta, canPrev, canNext, setPage, refetch } =
    useBookings(lang, type, perPage);

  const [searchTerm, setSearchTerm] = useState("");
  const [changingId, setChangingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return apiRows;
    return apiRows.filter((b) => {
      const bn = (b.booking_number || "").toLowerCase();
      const svc = (b.service || "").toLowerCase();
      return bn.includes(q) || svc.includes(q);
    });
  }, [apiRows, searchTerm]);

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

  const onChangeStatus = async (id: number, next: BookingStatus) => {
    setChangingId(id);
    const res = await changeBookingStatus(id, next, lang);
    setChangingId(null);

    if (!res.ok) return;

    // ✅ ريّح دماغك: اعمل refetch علشان لو booking اتنقل من upcoming لـ completed يختفي من الجدول الحالي
    await refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            className={`w-full ${lang === "ar" ? "pr-11 pl-4" : "pl-11 pr-4"
              } py-3 bg-white border border-gray-200 rounded-2xl outline-none`}
            placeholder={`${t.service}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search
            className={`absolute ${lang === "ar" ? "right-4" : "left-4"
              } top-1/2 -translate-y-1/2 text-gray-400`}
            size={18}
          />
        </div>
      </div>

      {isLoading ? (
        renderSkeleton()
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-auto">
          <table className="w-full text-start">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">
                  {t.bookingId}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">
                  {t.service}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">
                  {t.schedule}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">
                  {t.staffAssigned}
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
              {filtered.map((b) => {
                const serviceName = b.service?.trim() ? b.service : "—";
                const dateISO = b.start_date;
                const time24 = b.start_time;

                // ✅ لو API بيرجع status استخدمه، وإلا اشتقه من tab type
                const currentStatus: BookingStatus =
                  (b.status as BookingStatus) ||
                  (type === "completed" ? "completed" : "upcoming");

                return (
                  <tr key={b.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-semibold text-gray-400 text-xs">
                      {b.booking_number ? b.booking_number : `#${b.id}`}
                    </td>

                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {serviceName}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span
                          className="text-sm font-semibold text-gray-900"
                          dir="ltr"
                        >
                          {dateISO}
                        </span>
                        <span className="text-[10px] text-gray-500 font-normal">
                          {time24}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-gray-900">—</span>
                    </td>

                    <td
                      className={`px-6 py-4 ${lang === "ar" ? "text-start" : "text-end"
                        }`}
                    >
                      <div
                        className={`flex items-center gap-2 ${lang === "ar" ? "justify-start" : "justify-end"
                          }`}
                      >
                        {/* ✅ status badge */}
                        <span
                          className={`text-[10px] font-semibold px-3 py-1 rounded-full ${statusBadgeClass(
                            currentStatus
                          )}`}
                        >
                          {statusLabel(currentStatus, lang, t)}
                        </span>

                        {/* ✅ status select */}
                        <select
                          className="bg-gray-50 border border-gray-100 text-[10px] font-semibold rounded-lg px-2 py-2 outline-none disabled:opacity-60"
                          value={currentStatus}
                          disabled={changingId === b.id}
                          onChange={(e) => {
                            const next = e.target.value as BookingStatus;
                            if (next === currentStatus) return;
                            onChangeStatus(b.id, next);
                          }}
                        >
                          <option value="upcoming">{statusLabel("upcoming", lang, t)}</option>
                          <option value="completed">{statusLabel("completed", lang, t)}</option>
                          <option value="cancelled">{statusLabel("canceled", lang, t)}</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && meta && (
        <div className="flex items-center justify-between">
          <button
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white disabled:opacity-50"
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {lang === "ar" ? "السابق" : "Prev"}
          </button>

          <div className="text-xs text-gray-500">
            {meta.current_page} / {meta.last_page} — {meta.total}
          </div>

          <button
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white disabled:opacity-50"
            disabled={!canNext}
            onClick={() => setPage((p) => p + 1)}
          >
            {lang === "ar" ? "التالي" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingsModule;
