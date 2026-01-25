import React from "react";
import { ClipboardList } from "lucide-react";
import AppHeader from "../AppHeader";
import { Order } from "../../App";

export default function HistoryScreen({
    orders,
    onBack,
    onNavigateToHome,
    onOpenOrder,
}: {
    orders: Order[];
    onBack: () => void;
    onNavigateToHome: () => void;
    onOpenOrder: (id: string) => void;
}) {
    return (
        <div className="animate-fadeIn flex flex-col h-full bg-app-bg">
            <AppHeader title="سجل الحجوزات" onBack={onBack} />
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-28 pt-24">
                {orders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 text-app-gold/40 border border-app-card/30">
                            <ClipboardList size={48} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-lg font-bold text-app-text mb-6">لا يوجد أي حجوزات حتى الآن</h2>
                        <button
                            onClick={onNavigateToHome}
                            className="w-full bg-app-gold text-white font-bold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform"
                        >
                            استعراض الخدمات
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-bold text-app-text">رقم الحجز: {order.id}</span>
                                    <span className="text-[10px] font-bold px-3 py-1 bg-green-50 text-green-600 rounded-full">
                                        {order.status}
                                    </span>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <div className="flex justify-between text-xs text-app-textSec">
                                        <span>تاريخ الحجز:</span>
                                        <span className="font-medium" dir="ltr">{order.date}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-app-textSec">
                                        <span>الخدمة:</span>
                                        <span className="font-medium">{order.packageName || "خدمة محددة"}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold text-app-text">
                                        <span>الإجمالي:</span>
                                        <span className="text-app-gold">{order.total}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onOpenOrder(order.id)}
                                    className="w-full py-3 text-app-gold font-bold text-sm bg-app-bg rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
                                >
                                    عرض تفاصيل الحجز
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
