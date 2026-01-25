import React from "react";
import { AlertTriangle } from "lucide-react";

export default function DeleteAccountModal({
    isDeleting,
    onCancel,
    onConfirm,
}: {
    isDeleting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fadeIn">
            <div
                className="bg-white w-full max-w-[320px] rounded-[2rem] p-6 shadow-2xl animate-scaleIn text-center relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-base font-bold text-app-text mb-2 font-alexandria">تأكيد حذف الحساب</h2>
                <p className="text-xs text-app-textSec leading-loose mb-6 font-alexandria">
                    هل أنتِ متأكدة من حذف حسابك؟ لا يمكن التراجع عن هذه الخطوة.
                </p>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="w-full py-3.5 bg-red-50 text-red-500 font-bold rounded-xl text-xs active:scale-95 transition-transform font-alexandria disabled:opacity-70"
                    >
                        {isDeleting ? "جاري الحذف..." : "تأكيد الحذف"}
                    </button>

                    <button
                        onClick={onCancel}
                        className="w-full py-3.5 bg-app-bg text-app-text font-bold rounded-xl text-xs active:scale-95 transition-transform font-alexandria"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
    );
}
