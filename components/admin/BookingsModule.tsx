"use client";

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Phone, Mail, User, Check, AlertCircle } from "lucide-react";
import { translations, Locale } from "../../services/i18n";
import {
  BookingType,
  BookingStatus,
  changeBookingStatus,
  toastApi,
  ApiBooking
} from "./bookings/bookings.api";
import { useBookings } from "./bookings/useBookings";

interface BookingsModuleProps {
  type: BookingType;
  lang: Locale;
}

function statusLabel(status: BookingStatus, lang: Locale, t: any) {
  if (status === "upcoming") return t.upcomingStatus;
  if (status === "completed") return t.completedStatus;
  return t.canceledStatus;
}

function statusBadgeClass(status: BookingStatus) {
  if (status === "completed") return "bg-green-50 text-green-600";
  if (status === "cancelled") return "bg-red-50 text-red-600";
  return "bg-amber-50 text-amber-700"; // upcoming
}

const BookingsModule: React.FC<BookingsModuleProps> = ({ type, lang }) => {
  const navigate = useNavigate();
  const t = translations[lang];
  const perPage = 10;

  const { isLoading, apiRows, meta, canPrev, canNext, setPage, refetch } =
    useBookings(lang, type, perPage);

  const [searchTerm, setSearchTerm] = useState("");
  const [changingId, setChangingId] = useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<ApiBooking | null>(null);
  const [showPhoneActions, setShowPhoneActions] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    bookingId: number | null;
    action: "confirm" | "cancel" | null;
  }>({ show: false, bookingId: null, action: null });

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

  const handleActionClick = (bookingId: number, action: "confirm" | "cancel", e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({ show: true, bookingId, action });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.bookingId || !confirmDialog.action) return;

    const newStatus: BookingStatus =
      confirmDialog.action === "confirm" ? "completed" : "cancelled";

    setConfirmDialog({ show: false, bookingId: null, action: null });
    await onChangeStatus(confirmDialog.bookingId, newStatus);
  };

  const handleCancelDialog = () => {
    setConfirmDialog({ show: false, bookingId: null, action: null });
  };

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
                  <tr
                    key={b.id}
                    className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                    onClick={() => {
                      if (b.user) {
                        setSelectedBooking(b);
                        setShowPhoneActions(false);
                      }
                    }}
                  >
                    <td className="px-6 py-4 font-semibold text-gray-400 text-xs">
                      {b.booking_number ? b.booking_number : `#${b.id}`}
                    </td>

                    <td className="px-6 py-4">
                      {/* Show user avatar if available, alongside service */}
                      <div className="flex items-center gap-3">
                        {b.user && (
                          <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                            <img
                              src={b.user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.user.name)}&background=random`}
                              alt={b.user.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(b.user?.name || 'User')}&background=random`;
                              }}
                            />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900 line-clamp-1 max-w-[200px]" title={serviceName}>
                            {serviceName}
                          </span>
                          {b.user && <span className="text-[10px] text-gray-500">{b.user.name}</span>}
                        </div>
                      </div>
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

                        {/* ✅ action buttons */}
                        <div className="flex items-center gap-2">
                          {currentStatus === "upcoming" && (
                            <button
                              className="bg-green-500 hover:bg-green-600 text-white text-[10px] font-semibold rounded-lg px-3 py-2 outline-none disabled:opacity-60 transition-colors"
                              disabled={changingId === b.id}
                              onClick={(e) => handleActionClick(b.id, "confirm", e)}
                            >
                              {t.confirmBooking}
                            </button>
                          )}
                          {currentStatus !== "cancelled" && (
                            <button
                              className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-semibold rounded-lg px-3 py-2 outline-none disabled:opacity-60 transition-colors"
                              disabled={changingId === b.id}
                              onClick={(e) => handleActionClick(b.id, "cancel", e)}
                            >
                              {t.cancelBookingAction}
                            </button>
                          )}
                        </div>
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
            {t.prev}
          </button>

          <div className="text-xs text-gray-500">
            {meta.current_page} / {meta.last_page} — {meta.total}
          </div>

          <button
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white disabled:opacity-50"
            disabled={!canNext}
            onClick={() => setPage((p) => p + 1)}
          >
            {t.next}
          </button>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4 shadow-xl animate-scaleIn">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {confirmDialog.action === "confirm"
                ? t.confirmBooking
                : t.cancelBookingAction}
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmDialog.action === "confirm"
                ? t.confirmBookingQuestion
                : t.cancelBookingQuestion}
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold transition-colors"
                onClick={handleCancelDialog}
              >
                {t.back}
              </button>
              <button
                className={`px-4 py-2 rounded-xl font-semibold text-white transition-colors ${confirmDialog.action === "confirm"
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-red-500 hover:bg-red-600"
                  }`}
                onClick={handleConfirmAction}
              >
                {t.confirmBookingAction}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Popup */}
      {selectedBooking && selectedBooking.user && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white w-full max-w-[440px] rounded-[32px] shadow-2xl overflow-hidden animate-scaleIn relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
            >
              <X size={18} />
            </button>

            {/* Content */}
            <div className="p-8 flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-50 border-4 border-white shadow-lg mb-4">
                <img
                  src={selectedBooking.user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedBooking.user.name)}&background=random`}
                  alt={selectedBooking.user.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedBooking.user?.name || 'User')}&background=random`;
                  }}
                />
              </div>

              {/* Name & ID */}
              <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedBooking.user.name}</h2>
              <span className="text-xs font-medium text-[#483383] bg-[#483383]/10 px-3 py-1 rounded-full mb-6">
                ID: {selectedBooking.user.id}
              </span>

              {/* Contact Info */}
              <div className="w-full space-y-3 mb-2">
                {selectedBooking.user.phone && (
                  <div
                    className={`flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer ${showPhoneActions ? 'bg-blue-50 ring-2 ring-blue-100' : 'bg-gray-50'}`}
                    onClick={() => setShowPhoneActions(!showPhoneActions)}
                  >
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm shrink-0">
                      <Phone size={14} />
                    </div>
                    {!showPhoneActions ? (
                      <span className="text-sm font-semibold text-gray-600" dir="ltr">{selectedBooking.user.phone}</span>
                    ) : (
                      <div className="flex items-center gap-2 animate-fadeIn w-full justify-between">
                        <span className="text-sm font-semibold text-gray-600" dir="ltr">{selectedBooking.user.phone}</span>
                        <a
                          href={`tel:${selectedBooking.user.phone}`}
                          className="flex-1 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-sm flex justify-center items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t.call}
                        </a>
                        <a
                          href={`https://wa.me/${selectedBooking.user.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-1.5 bg-[#25D366] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity shadow-sm flex justify-center items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t.whatsapp}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {selectedBooking.user.email && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm">
                      <Mail size={14} />
                    </div>
                    <span className="text-sm font-semibold text-gray-600 truncate">{selectedBooking.user.email}</span>
                  </div>
                )}
              </div>
              {/* show more */}
              <button
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold transition-colors"
                onClick={() => {
                  // navigate to user details page
                  if (selectedBooking) {
                    navigate(`/admin/users/${selectedBooking.user.id}`);
                  }
                }}
              >
                {t.showMore}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsModule;
