import React from "react";
import { ShoppingBag } from "lucide-react";
import AppHeader from "../AppHeader";
import { Order } from "../../App";

export default function OrderDetailsScreen({
    order,
    onBack,
}: {
    order: Order | null;
    onBack: () => void;
}) {
    if (!order) return null;

    return (
        <div className="animate-fadeIn flex flex-col h-full bg-app-bg">
            <AppHeader title="تفاصيل الحجز" onBack={onBack} />
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 px-6 pb-28 pt-24">
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-app-bg rounded-xl text-app-gold">
                            <ShoppingBag size={20} />
                        </div>
                        <span className="text-sm font-bold text-app-text">ملخص الحجز</span>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-xs text-app-textSec">
                            <span>رقم الحجز</span>
                            <span className="font-bold text-app-text">#{order.id}</span>
                        </div>
                        <div className="flex justify-between text-xs text-app-textSec">
                            <span>التاريخ</span>
                            <span className="font-medium text-app-text" dir="ltr">{order.date}</span>
                        </div>
                        <div className="flex justify-between text-xs text-app-textSec">
                            <span>الحالة</span>
                            <span className="text-green-600 font-bold">{order.status}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30">
                    <div className="pt-3 flex justify-between">
                        <span className="text-sm font-bold text-app-text">الإجمالي الكلي</span>
                        <span className="text-lg font-bold text-app-gold">{order.total}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
