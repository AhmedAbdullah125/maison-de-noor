import React from "react";
import { Ticket, Plus, Copy, Trash } from "lucide-react";
import { Locale } from "../../../../services/i18n";
import { ServiceSubscription } from "../../../../types";

export default function SubscriptionsCard({
    lang,
    t,
    subscriptions,
    onAdd,
    onRemove,
    onDuplicate,
    onChange,
    calcPreview,
}: {
    lang: Locale;
    t: any;
    subscriptions: any[];
    onAdd: () => void;
    onRemove: (id: string) => void;
    onDuplicate: (sub: any) => void;
    onChange: (id: string, field: keyof ServiceSubscription, value: any) => void;
    calcPreview: (sessions: number, percent: number) => number;
}) {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <div>
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <Ticket size={18} className="text-[#483383]" />
                        {t.serviceSubscriptions}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-1 font-semibold">{t.subscriptionsHelper}</p>
                </div>

                <button
                    onClick={onAdd}
                    className="bg-[#483383]/10 text-[#483383] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#483383] hover:text-white transition-all"
                >
                    <Plus size={16} />
                    <span>{t.addSubscription}</span>
                </button>
            </div>

            <div className="space-y-4">
                {subscriptions.length === 0 && (
                    <div className="py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-sm text-gray-400 font-semibold">{t.noContentYet}</p>
                    </div>
                )}

                {subscriptions.map((sub: any) => (
                    <div
                        key={sub.id}
                        className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 relative group transition-all hover:border-gray-200 hover:shadow-sm"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                                    {t.subscriptionTitle}
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-[#483383]"
                                    value={sub.title}
                                    onChange={(e) => onChange(sub.id, "title", e.target.value)}
                                    placeholder={lang === "ar" ? "مثال: باقة التوفير" : "e.g. Saver Package"}
                                />
                            </div>

                            <div className="flex gap-2 mr-4 ml-4">
                                <button
                                    onClick={() => onDuplicate(sub)}
                                    className="p-2 text-gray-400 hover:text-blue-500 bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
                                    title={t.duplicate}
                                >
                                    <Copy size={16} />
                                </button>

                                <button
                                    onClick={() => onRemove(sub.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
                                    title={t.delete}
                                >
                                    <Trash size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                                    {t.sessionsCount}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-[#483383]"
                                    value={sub.sessionsCount}
                                    onChange={(e) =>
                                        onChange(sub.id, "sessionsCount", parseInt(e.target.value || "0", 10))
                                    }
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                                    {t.pricePercent}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="999"
                                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-[#483383]"
                                    value={sub.pricePercent}
                                    onChange={(e) =>
                                        onChange(sub.id, "pricePercent", parseInt(e.target.value || "0", 10))
                                    }
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                                    {t.validityDays}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-[#483383]"
                                    value={sub.validityDays}
                                    onChange={(e) =>
                                        onChange(sub.id, "validityDays", parseInt(e.target.value || "0", 10))
                                    }
                                />
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
                            <p className="text-[10px] font-semibold text-gray-500">
                                {t.estimatedTotal}:{" "}
                                <span className="text-[#483383] text-sm">
                                    {calcPreview(sub.sessionsCount, sub.pricePercent).toFixed(3)} {t.currency}
                                </span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
