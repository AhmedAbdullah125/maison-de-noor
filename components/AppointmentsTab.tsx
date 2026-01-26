"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Calendar, Info, Check, Ticket, Home, MapPin } from "lucide-react";
import { useLocation } from "react-router-dom";
import AppHeader from "./AppHeader";
import { toast as sonnerToast } from "sonner";

// ✅ use your existing http (same one used in createRequest)
import { http } from "./services/http";

type ApiAppointmentsResponse = {
  status: boolean;
  statusCode: number;
  message: string;
  items: ApiAppointmentItem[];
};

type ApiAppointmentItem = {
  id: number;
  request_number: string;
  service: string;
  status: string; // "confirmed" ...
  is_confirmed: boolean;
  payment_type: string;
  payment_status: string;
  start_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm:ss
  base_price: string;
  options_price: string;
  final_price: string;
};

// ✅ UI appointment type (keep compatible with your current UI)
type Appointment = {
  id: string;
  source?: "subscription" | "service";
  bookingType?: "HOME_SERVICE" | "CLINIC" | string;

  serviceName: string;
  status: "upcoming" | "completed" | "cancelled" | string;

  dateISO: string; // YYYY-MM-DD
  time24: string;  // HH:mm or HH:mm:ss

  address?: {
    area: string;
    block: string;
    street: string;
    building: string;
    apartment?: string;
  } | null;

  // optional extras
  requestNumber?: string;
  paymentType?: string;
  paymentStatus?: string;
  finalPrice?: string;
};

function normalizeTimeToHHmm(t: string) {
  if (!t) return "";
  // "20:58:00" -> "20:58"
  if (t.length >= 5) return t.slice(0, 5);
  return t;
}

function mapApiStatusToAppointmentStatus(apiStatus: string, isConfirmed: boolean): Appointment["status"] {
  // you can extend mapping later (cancelled, completed, pending...)
  if (apiStatus === "confirmed" || isConfirmed) return "upcoming";
  if (apiStatus === "completed") return "completed";
  if (apiStatus === "cancelled") return "cancelled";
  return "upcoming";
}

const AppointmentsTab: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const location = useLocation();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.toastMessage) {
      setToastMessage(location.state.toastMessage);
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);

      const res = await http.get<ApiAppointmentsResponse>("/requests", {
        params: { type: "appointments" },
        headers: { lang: "ar" },
      });

      if (!res?.data?.status) {
        const msg = res?.data?.message || "فشل تحميل المواعيد";
        sonnerToast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
        setAppointments([]);
        return;
      }

      const mapped: Appointment[] = (res.data.items ?? []).map((it) => ({
        id: String(it.id),
        source: "service", // from this endpoint it’s normal appointments
        bookingType: "CLINIC",

        serviceName: it.service,
        status: mapApiStatusToAppointmentStatus(it.status, it.is_confirmed),

        dateISO: it.start_date,
        time24: normalizeTimeToHHmm(it.start_time),

        requestNumber: it.request_number,
        paymentType: it.payment_type,
        paymentStatus: it.payment_status,
        finalPrice: it.final_price,
        address: null,
      }));

      // sort by date+time ASC
      mapped.sort((a, b) => {
        const aT = new Date(`${a.dateISO}T${a.time24.length === 5 ? a.time24 : a.time24.slice(0, 5)}`).getTime();
        const bT = new Date(`${b.dateISO}T${b.time24.length === 5 ? b.time24 : b.time24.slice(0, 5)}`).getTime();
        return aT - bT;
      });

      setAppointments(mapped);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "appointments error";
      sonnerToast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upcomingAppointments = useMemo(
    () => appointments.filter((a) => a.status === "upcoming"),
    [appointments]
  );

  const renderSkeleton = () => (
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-[2.5rem] h-56 animate-pulse border border-app-card/30" />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fadeIn relative bg-app-bg">
      <AppHeader title="مواعيدي" />

      {/* Success Toast (from navigation state) */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] bg-green-500 text-white py-3 px-4 rounded-2xl shadow-xl flex items-center gap-3 z-[100] animate-slideUp">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Check size={16} strokeWidth={3} />
          </div>
          <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-28 pt-24">
        {isLoading ? (
          renderSkeleton()
        ) : upcomingAppointments.length > 0 ? (
          <div className="space-y-6">
            {upcomingAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-app-card/30"
              >
                <div className="bg-app-gold/5 p-6 flex items-center justify-between border-b border-app-bg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl text-app-gold shadow-sm">
                      {appointment.source === "subscription" ? (
                        <Ticket size={28} />
                      ) : appointment.bookingType === "HOME_SERVICE" ? (
                        <Home size={28} />
                      ) : (
                        <Calendar size={28} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-app-text">موعد قادم</h3>
                      <p className="text-xs text-app-textSec text-green-600 font-medium">
                        حالة الحجز: {appointment.status === "upcoming" ? "مؤكد" : appointment.status}
                      </p>
                    </div>
                  </div>

                  {appointment.source === "subscription" && (
                    <span className="bg-app-gold text-white text-[10px] font-bold px-2 py-1 rounded-lg">اشتراك</span>
                  )}
                  {appointment.bookingType === "HOME_SERVICE" && (
                    <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg">زيارة منزلية</span>
                  )}
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-app-bg rounded-xl text-app-gold">
                      <Info size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-app-textSec uppercase tracking-wider">الخدمات</span>
                      <span className="text-sm font-bold text-app-text truncate max-w-[220px]">
                        {appointment.serviceName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-app-bg rounded-xl text-app-gold">
                      <CalendarDays size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-app-textSec uppercase tracking-wider">تاريخ الموعد</span>
                      <span className="text-sm font-bold text-app-text" dir="ltr">
                        {appointment.dateISO}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-app-bg rounded-xl text-app-gold">
                      <Clock size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-app-textSec uppercase tracking-wider">وقت الموعد</span>
                      <span className="text-sm font-bold text-app-text" dir="ltr">
                        {appointment.time24}
                      </span>
                    </div>
                  </div>

                  {appointment.bookingType === "HOME_SERVICE" && appointment.address && (
                    <div className="flex items-start gap-4 bg-green-50 p-3 rounded-2xl border border-green-100">
                      <div className="p-2 bg-white rounded-xl text-green-600 shadow-sm mt-0.5">
                        <MapPin size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1">
                          العنوان المسجل
                        </span>
                        <p className="text-xs font-bold text-app-text leading-relaxed">
                          {appointment.address.area}, قطعة {appointment.address.block}, شارع {appointment.address.street}
                          <br />
                          منزل {appointment.address.building}{" "}
                          {appointment.address.apartment && `, شقة ${appointment.address.apartment}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Optional footer row (nice-to-have) */}
                  {(appointment.requestNumber || appointment.finalPrice) && (
                    <div className="bg-app-bg/40 rounded-2xl p-3 border border-app-card/30 flex items-center justify-between">
                      <div className="text-[10px] font-bold text-app-textSec">
                        {appointment.requestNumber ? `رقم الطلب: ${appointment.requestNumber}` : ""}
                      </div>
                      {appointment.finalPrice ? (
                        <div className="text-xs font-bold text-app-gold">{Number(appointment.finalPrice).toFixed?.(3) ?? appointment.finalPrice} د.ك</div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center pb-12 animate-fadeIn">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-app-card/30 text-app-gold/40">
              <CalendarDays size={48} strokeWidth={1.5} />
            </div>

            <h2 className="text-lg font-bold text-app-text mb-2 text-center">لا توجد مواعيد حالياً</h2>
            <p className="text-sm text-app-textSec text-center max-w-[200px]">
              يمكنك حجز موعد جديد من خلال اختيار الخدمات من الصفحة الرئيسية أو من اشتراكاتي
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsTab;
