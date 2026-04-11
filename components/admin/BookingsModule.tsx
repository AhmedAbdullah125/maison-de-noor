"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Phone, Mail, User, Check, AlertCircle, Calendar, Clock, CreditCard, Activity, FileText } from "lucide-react";
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


  const [paymentFilter, setPaymentFilter] = useState<"paid" | "unpaid" | "all">("paid");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { isLoading, apiRows, meta, canPrev, canNext, setPage, refetch } =
    useBookings(lang, type, perPage, paymentFilter, debouncedSearch);

  const [changingId, setChangingId] = useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<ApiBooking | null>(null);
  const [showPhoneActions, setShowPhoneActions] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    bookingId: number | null;
    action: "confirm" | "cancel" | null;
  }>({ show: false, bookingId: null, action: null });

  const filtered = apiRows;

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
        <div className="relative w-full md:w-96 flex items-center gap-2">
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
          {/* Payment Status Filter */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaymentFilter("all")}
              className={`px-4 py-2.5 rounded-2xl text-sm font-semibold border transition-colors ${paymentFilter === "all"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
            >
              {t.all || "All"}
            </button>
            <button
              onClick={() => setPaymentFilter("paid")}
              className={`px-4 py-2.5 rounded-2xl text-sm font-semibold border transition-colors ${paymentFilter === "paid"
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
            >
              {t.paid || "Paid"}
            </button>
          </div>

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
                  {t.customer || 'Customer'}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">
                  {t.schedule}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">
                  {t.staffAssigned}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">
                  {t.paymentStatus}
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
                      setSelectedBooking(b);
                      setShowPhoneActions(false);
                    }}
                  >
                    <td className="px-2 py-2 font-semibold text-gray-400 text-xs">
                      {b.booking_number ? b.booking_number : `#${b.id}`}
                    </td>

                    <td className="px-2 py-2">
                      <span className="text-sm font-semibold text-gray-900 line-clamp-1 max-w-[200px]" title={serviceName}>
                        {serviceName}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-3">
                        {b.user ? (
                          <>
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
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-gray-900">{b.user.name}</span>
                              {b.user.phone && <span className="text-[10px] text-gray-500">{b.user.phone}</span>}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-gray-900">—</span>
                        )}
                      </div>
                    </td>

                    <td className="px-2 py-2">
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-1">
                          {b?.request?.payment?.payment_status === "paid" ? (
                            <span className="inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                              {t.paid || 'Paid'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                              {t.unpaid || 'Unpaid'}
                            </span>
                          )}
                          {b?.request?.payment?.payment_type && (
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider px-1">
                              {b.request.payment.payment_type}
                            </span>
                          )}
                        </div>
                        <span>
                          {b?.request?.pricing?.final_price} {t.currency}
                        </span>
                      </div>
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

      {/* Booking Details Popup */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-fadeIn overflow-y-auto"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white w-full max-w-2xl lg:max-w-3xl rounded-[32px] shadow-2xl overflow-hidden animate-scaleIn relative my-auto max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Sticky Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10 shrink-0">
               <div>
                 <h2 className="text-xl font-bold text-gray-900 mb-1" dir="ltr">{selectedBooking.booking_number || `#${selectedBooking.id}`}</h2>
                 <span className="text-sm font-semibold text-gray-500">{selectedBooking.service}</span>
               </div>
               <button
                  onClick={() => setSelectedBooking(null)}
                  className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 custom-scrollbar">
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Schedule Info */}
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                       <Calendar size={16} className="text-blue-500" />
                       {t.schedule || "Schedule"}
                    </h3>
                    <div className="space-y-3">
                       <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">{t.date || "Date"}</span>
                          <span className="text-sm font-semibold text-gray-900" dir="ltr">{selectedBooking.start_date}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">{t.time || "Time"}</span>
                          <span className="text-sm font-semibold text-gray-900" dir="ltr">{selectedBooking.start_time}</span>
                       </div>
                       {selectedBooking.request?.status && (
                         <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-xs text-gray-500">{t.status || "Status"}</span>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide bg-gray-200 text-gray-700`}>
                              {selectedBooking.request.status}
                            </span>
                         </div>
                       )}
                    </div>
                  </div>

                  {/* Customer Info */}
                  {selectedBooking.user ? (
                      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <User size={16} className="text-purple-500" />
                          {t.customer || "Customer Details"}
                        </h3>
                        <div className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate(`/admin/users/${selectedBooking.user.id}`)}>
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-white border-2 border-white shadow-sm shrink-0">
                             <img src={selectedBooking.user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedBooking.user.name)}&background=random`} alt={selectedBooking.user.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                             <div className="text-sm font-bold text-gray-900">{selectedBooking.user.name}</div>
                             <div className="text-xs text-gray-500">ID: {selectedBooking.user.id}</div>
                          </div>
                        </div>
                        <div className="space-y-2 flex flex-col justify-end">
                          {selectedBooking.user.phone && (
                            <div className="flex items-center justify-between">
                               <a href={`tel:${selectedBooking.user.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors" dir="ltr" onClick={(e) => e.stopPropagation()}>
                                 <Phone size={14} /> {selectedBooking.user.phone}
                               </a>
                               <a href={`https://wa.me/${selectedBooking.user.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-[10px] bg-[#25D366] text-white px-2 py-1 rounded-lg font-bold" onClick={(e) => e.stopPropagation()}>
                                 {t.whatsapp || "WhatsApp"}
                               </a>
                            </div>
                          )}
                          {selectedBooking.user.email && (
                            <a href={`mailto:${selectedBooking.user.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors truncate" onClick={(e) => e.stopPropagation()}>
                              <Mail size={14} className="shrink-0" /> <span className="truncate">{selectedBooking.user.email}</span>
                            </a>
                          )}
                        </div>
                      </div>
                  ) : (
                      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex items-center justify-center">
                          <span className="text-sm text-gray-500">{t.noCustomerData || "No customer data available"}</span>
                      </div>
                  )}

                  {/* Payment & Pricing */}
                  {selectedBooking.request?.pricing && (
                      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 h-fit">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <CreditCard size={16} className="text-green-500" />
                            {t.paymentInfo || "Payment & Pricing"}
                          </h3>
                          {selectedBooking.request?.payment && (
                             <div className="flex items-center gap-1">
                               <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${selectedBooking.request.payment.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {selectedBooking.request.payment.payment_status === 'paid' ? (t.paid || 'Paid') : (t.unpaid || 'Unpaid')}
                               </span>
                               {selectedBooking.request.payment.payment_type && (
                                <span className="text-[9px] uppercase font-bold text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full">
                                    {selectedBooking.request.payment.payment_type}
                                </span>
                               )}
                             </div>
                          )}
                        </div>
                        <div className="space-y-3">
                           <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">{t.basePrice || "Base Price"}</span>
                              <span className="text-sm font-semibold text-gray-900" dir="ltr">{selectedBooking.request.pricing.base_price} {t.currency}</span>
                           </div>
                           {selectedBooking.request.pricing.options_price !== "0.00" && (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">{t.optionsPrice || "Options Price"}</span>
                                <span className="text-sm font-semibold text-gray-900" dir="ltr">{selectedBooking.request.pricing.options_price} {t.currency}</span>
                              </div>
                           )}
                           {selectedBooking.request.pricing.discount_amount !== "0.00" && (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">{t.discount || "Discount"}</span>
                                <span className="text-sm font-semibold text-red-500" dir="ltr">{selectedBooking.request.pricing.discount_amount} {t.currency}</span>
                              </div>
                           )}
                           <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                              <span className="text-xs font-semibold text-gray-900">{t.total || "Final Total"}</span>
                              <span className="text-sm font-bold text-green-600" dir="ltr">{selectedBooking.request.pricing.final_price} {t.currency}</span>
                           </div>
                        </div>
                      </div>
                  )}

                  {/* Sessions Info */}
                  {selectedBooking.request?.sessions_info && (
                      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 h-fit">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Activity size={16} className="text-orange-500" />
                          {t.sessionsInfo || "Sessions Details"}
                        </h3>
                        <div className="space-y-3">
                           <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">{t.totalSessions || "Total Sessions"}</span>
                              <span className="text-sm font-semibold text-gray-900">{selectedBooking.request.sessions_info.session_count}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">{t.completedSessions || "Completed"}</span>
                              <span className="text-sm font-semibold text-green-600">{selectedBooking.request.sessions_info.completed_sessions}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">{t.remainingSessions || "Remaining"}</span>
                              <span className="text-sm font-semibold text-orange-600">{selectedBooking.request.sessions_info.remaining_sessions}</span>
                           </div>
                           
                           {/* Progress */}
                           <div className="pt-2">
                              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden flex" dir="ltr">
                                 <div 
                                    className="bg-green-500 h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${selectedBooking.request.sessions_info.progress || 0}%` }}
                                 ></div>
                              </div>
                              <div className="text-[10px] font-medium text-gray-500 text-end mt-1.5">{selectedBooking.request.sessions_info.progress || 0}%</div>
                           </div>
                        </div>
                      </div>
                  )}

                  {/* Notes (if any) */}
                  {(selectedBooking.request?.notes?.customer_notes || selectedBooking.request?.notes?.admin_notes) && (
                      <div className="md:col-span-2 bg-yellow-50/50 rounded-2xl p-5 border border-yellow-100">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FileText size={16} className="text-yellow-600" />
                          {t.notes || "Notes"}
                        </h3>
                        <div className="space-y-3">
                           {selectedBooking.request.notes.customer_notes && (
                             <div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">{t.customerNotes || "Customer Notes"}</span>
                                <p className="text-sm text-gray-800 bg-white p-3 rounded-xl border border-yellow-100/50">{selectedBooking.request.notes.customer_notes}</p>
                             </div>
                           )}
                           {selectedBooking.request.notes.admin_notes && (
                             <div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">{t.adminNotes || "Admin Notes"}</span>
                                <p className="text-sm text-gray-800 bg-white p-3 rounded-xl border border-yellow-100/50">{selectedBooking.request.notes.admin_notes}</p>
                             </div>
                           )}
                        </div>
                      </div>
                  )}

               </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsModule;
