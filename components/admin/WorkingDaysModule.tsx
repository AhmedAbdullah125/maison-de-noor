"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Check, Clock } from "lucide-react";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";
import { Locale, translations } from "../../services/i18n";
import { toast } from "sonner";
import { http } from "../services/http";

// ─── Types ─────────────────────────────────────────────────────────────────

type WorkingDay = {
    id: number;
    iso_weekday: number;
    day_name_ar: string;
    day_name_en: string;
    is_open: boolean;
    work_start_time: string | null;
    work_end_time: string | null;
};

// ─── API helpers ────────────────────────────────────────────────────────────

async function fetchWorkingDays(lang: Locale): Promise<WorkingDay[]> {
    const token = localStorage.getItem("token");
    const res = await http.get<{ status: boolean; data: { data: WorkingDay[] }; message: string }>(
        `${DASHBOARD_API_BASE_URL}/business-working-days`,
        { headers: { lang, Accept: "application/json", Authorization: `Bearer ${token}` } }
    );
    if (!res?.data?.status) throw new Error(res?.data?.message || "Failed to fetch");
    return res.data.data.data;
}

async function updateWorkingDay(
    id: number,
    payload: { is_open: boolean; work_start_time?: string | null; work_end_time?: string | null },
    lang: Locale
) {
    const token = localStorage.getItem("token");
    const fd = new FormData();
    fd.append("_method", "PATCH");
    fd.append("is_open", payload.is_open ? "1" : "0");
    if (payload.work_start_time) fd.append("work_start_time", payload.work_start_time);
    if (payload.work_end_time)   fd.append("work_end_time",   payload.work_end_time);
    const res = await http.post<{ status: boolean; message: string }>(
        `${DASHBOARD_API_BASE_URL}/business-working-days/${id}`,
        fd,
        { headers: { lang, Accept: "application/json", Authorization: `Bearer ${token}` } }
    );
    return res?.data;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** "09:00:00" → "09:00" for <input type="time"> */
const toTimeInput = (t: string | null) => (t ? t.slice(0, 5) : "");

/** "09:00" → "09:00:00" for the API */
const toTimeApi = (t: string) => (t ? `${t}:00` : null);

// ─── Component ───────────────────────────────────────────────────────────────

export default function WorkingDaysModule({ lang }: { lang: Locale }) {
    const t = translations[lang];
    const [days, setDays] = useState<WorkingDay[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [saving, setSaving] = useState<number | null>(null); // id of day being saved

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        fetchWorkingDays(lang)
            .then((data) => { if (mounted) setDays(data); })
            .catch(() => { if (mounted) toast.error(lang === "ar" ? "فشل تحميل أيام العمل" : "Failed to load working days"); })
            .finally(() => { if (mounted) setIsLoading(false); });
        return () => { mounted = false; };
    }, [lang]);

    // Optimistic local update
    const patchDay = (id: number, patch: Partial<WorkingDay>) => {
        setDays(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
    };

    // Re-fetch full list from server
    const revalidate = async () => {
        try {
            const fresh = await fetchWorkingDays(lang);
            setDays(fresh);
        } catch {
            // silently ignore; stale data is still usable
        }
    };

    const handleToggle = async (day: WorkingDay) => {
        const newOpen = !day.is_open;
        patchDay(day.id, { is_open: newOpen });
        setSaving(day.id);
        const payload = {
            is_open: newOpen,
            work_start_time: newOpen ? (day.work_start_time ?? "09:00:00") : null,
            work_end_time: newOpen ? (day.work_end_time ?? "21:00:00") : null,
        };
        const res = await updateWorkingDay(day.id, payload, lang);
        setSaving(null);
        if (!res?.status) {
            patchDay(day.id, { is_open: day.is_open }); // rollback
            toast.error(res?.message || (lang === "ar" ? "فشل التحديث" : "Update failed"));
        } else {
            toast.success(res.message || (lang === "ar" ? "تم الحفظ" : "Saved"));
            await revalidate();
        }
    };

    const handleTimeBlur = async (day: WorkingDay, field: "work_start_time" | "work_end_time", value: string) => {
        const apiValue = toTimeApi(value);
        patchDay(day.id, { [field]: apiValue });
        setSaving(day.id);
        const res = await updateWorkingDay(day.id, {
            is_open: day.is_open,
            work_start_time: field === "work_start_time" ? apiValue : day.work_start_time,
            work_end_time: field === "work_end_time" ? apiValue : day.work_end_time,
        }, lang);
        setSaving(null);
        if (!res?.status) {
            toast.error(res?.message || (lang === "ar" ? "فشل التحديث" : "Update failed"));
        } else {
            toast.success(res.message || (lang === "ar" ? "تم الحفظ" : "Saved"));
            await revalidate();
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <div key={i} className="h-20 bg-white rounded-3xl border border-gray-100 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t.workingDays}</h1>
                    <p className="text-sm text-gray-400 mt-1">{t.workingDaysHint}</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-[#483383]/10 rounded-2xl">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#483383]" />
                    <span className="text-xs font-bold text-[#483383]">
                        {days.filter(d => d.is_open).length} {lang === "ar" ? "أيام مفتوحة" : "open days"}
                    </span>
                </div>
            </div>

            {/* Days cards */}
            <div className="space-y-3">
                {days.map(day => {
                    const isSavingThis = saving === day.id;
                    const dayName = lang === "ar" ? day.day_name_ar : day.day_name_en;

                    return (
                        <div
                            key={day.id}
                            className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden ${day.is_open
                                    ? "border-[#483383]/20 shadow-sm shadow-[#483383]/5"
                                    : "border-gray-100 opacity-60"
                                }`}
                        >
                            <div className="flex items-center gap-4 px-6 py-5">
                                {/* Day indicator */}
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${day.is_open ? "bg-[#483383] text-white" : "bg-gray-100 text-gray-400"
                                    }`}>
                                    {dayName.charAt(0)}
                                </div>

                                {/* Day name */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-sm">{dayName}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {day.is_open
                                            ? (lang === "ar" ? "مفتوح" : "Open")
                                            : (lang === "ar" ? "مغلق" : "Closed")}
                                    </p>
                                </div>

                                {/* Time range — only when open */}
                                {day.is_open && (
                                    <div className="flex items-center gap-3 flex-wrap justify-end">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-gray-400 shrink-0" />
                                            <input
                                                type="time"
                                                defaultValue={toTimeInput(day.work_start_time)}
                                                onBlur={e => handleTimeBlur(day, "work_start_time", e.target.value)}
                                                className="p-2 text-sm bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#483383] transition-all w-32"
                                            />
                                        </div>
                                        <span className="text-gray-300 font-bold">—</span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="time"
                                                defaultValue={toTimeInput(day.work_end_time)}
                                                onBlur={e => handleTimeBlur(day, "work_end_time", e.target.value)}
                                                className="p-2 text-sm bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#483383] transition-all w-32"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Saving spinner or toggle */}
                                <div className="shrink-0">
                                    {isSavingThis ? (
                                        <Loader2 size={22} className="animate-spin text-[#483383]" />
                                    ) : (
                                        <button
                                            onClick={() => handleToggle(day)}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${day.is_open ? "bg-[#483383]" : "bg-gray-200"
                                                }`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${lang === "ar"
                                                    ? (day.is_open ? "right-1" : "right-7")
                                                    : (day.is_open ? "left-7" : "left-1")
                                                }`} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
