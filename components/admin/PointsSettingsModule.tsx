"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";
import { Locale, translations } from "../../services/i18n";
import { toast } from "sonner";
import { http } from "../services/http";

// ─── Types ─────────────────────────────────────────────────────────────────

type PointsSettings = {
    earn_rate: number;
    conversion_rate: number;
};

// ─── API helpers ────────────────────────────────────────────────────────────

type PointsSettingsResponse = {
    status: boolean;
    message?: string;
    data: PointsSettings;
};

async function fetchPointsSettings(lang: Locale): Promise<PointsSettings> {
    const res = await http.get<PointsSettingsResponse>(
        `${DASHBOARD_API_BASE_URL}/points-settings`,
        { headers: { lang, Accept: "application/json" } }
    );
    if (!res?.data?.status) throw new Error(res?.data?.message || "Failed to fetch");
    return res.data.data;
}

async function updatePointsSettings(payload: PointsSettings, lang: Locale): Promise<PointsSettingsResponse> {
    const res = await http.patch<PointsSettingsResponse>(
        `${DASHBOARD_API_BASE_URL}/points-settings`,
        payload,
        { headers: { lang, Accept: "application/json" } }
    );
    return res.data;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PointsSettingsModule({ lang }: { lang: Locale }) {
    const t = translations[lang];
    const [settings, setSettings] = useState<PointsSettings>({ earn_rate: 1, conversion_rate: 100 });
    const [isLoading, setIsLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        fetchPointsSettings(lang)
            .then((data) => { if (mounted) setSettings(data); })
            .catch(() => { if (mounted) toast.error(lang === "ar" ? "فشل تحميل إعدادات النقاط" : "Failed to load points settings"); })
            .finally(() => { if (mounted) setIsLoading(false); });
        return () => { mounted = false; };
    }, [lang]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await updatePointsSettings(settings, lang);
            if (!res.status) {
                toast.error(res.message || (lang === "ar" ? "فشل التحديث" : "Update failed"));
                return;
            }
            toast.success(res.message || (lang === "ar" ? "تم الحفظ" : "Saved"));
            setSettings(res.data);
        } catch {
            toast.error(lang === "ar" ? "فشل التحديث" : "Update failed");
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-32 bg-white rounded-3xl border border-gray-100 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t.pointsSettings}</h1>
                <p className="text-sm text-gray-400 mt-1">{t.pointsSettingsHint}</p>
            </div>

            {/* Settings card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm shadow-[#483383]/5 p-6 space-y-6 max-w-xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#483383]/10 flex items-center justify-center text-[#483383] shrink-0">
                        <Star size={18} />
                    </div>
                    <p className="text-sm text-gray-500">{t.pointsSettingsDescription}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">{t.earnRate}</label>
                        <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={settings.earn_rate}
                            onChange={(e) => setSettings((prev) => ({ ...prev, earn_rate: Number(e.target.value) }))}
                            className="w-full p-3 text-sm bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#483383] transition-all"
                        />
                        <p className="text-[11px] text-gray-400 mt-1.5">{t.earnRateHint}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">{t.conversionRate}</label>
                        <input
                            type="number"
                            min={1}
                            step="1"
                            value={settings.conversion_rate}
                            onChange={(e) => setSettings((prev) => ({ ...prev, conversion_rate: Number(e.target.value) }))}
                            className="w-full p-3 text-sm bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#483383] transition-all"
                        />
                        <p className="text-[11px] text-gray-400 mt-1.5">{t.conversionRateHint}</p>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-[#483383] text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all"
                    >
                        {saving && <Loader2 size={16} className="animate-spin" />}
                        {t.save}
                    </button>
                </div>
            </div>
        </div>
    );
}
