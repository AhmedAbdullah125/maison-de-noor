import React, { useMemo } from "react";
import { X, ChevronLeft, User, Video, ShoppingBag } from "lucide-react";
import { Brand } from "../../types";
import { useGetServices } from "../services/useGetServices";

interface Props {
    open: boolean;
    onClose: () => void;
    onNavigate: (path: string) => void;
    lang: string;
}

export default function HomeDrawer({ open, onClose, onNavigate, lang = "ar" }: Props) {
    const { data, isLoading, isFetching, isError } = useGetServices(lang, 1);

    // ✅ services من API
    const services = useMemo(() => {
        const list = data?.items?.services ?? [];
        // ✅ اعرض الـ parent فقط (القائمة الرئيسية)
        return list.filter((s: any) => s?.is_parent === true);
    }, [data]);

    // ✅ لو عايز تحافظ على Brand type للـ UI الحالي
    const brands: Brand[] = useMemo(() => {
        return services.map((s: any) => ({
            id: s.id,
            name: s.name,
            image: s.main_image, // أو خليها فاضية لو مش بتستخدمها
        })) as Brand[];
    }, [services]);

    if (!open) return null;

    return (
        <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div
                className="absolute right-0 top-0 bottom-0 w-3/4 max-w-[320px] bg-white shadow-2xl animate-slideLeftRtl flex flex-col fixed h-full"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 flex items-center justify-between border-b border-app-card/30 bg-white z-10">
                    <span className="text-lg font-bold text-app-text font-alexandria">الخدمات</span>
                    <button onClick={onClose} className="p-2 hover:bg-app-bg rounded-full transition-colors text-app-text">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar py-4 flex flex-col">
                    <div className="flex-1">
                        {(isLoading || isFetching) && (
                            <div className="px-6 py-4 space-y-3">
                                <div className="h-10 rounded-xl bg-app-bg animate-pulse" />
                                <div className="h-10 rounded-xl bg-app-bg animate-pulse" />
                                <div className="h-10 rounded-xl bg-app-bg animate-pulse" />
                            </div>
                        )}

                        {isError && !(isLoading || isFetching) && (
                            <div className="px-6 py-6 text-center text-app-textSec text-sm">
                                حصل خطأ أثناء تحميل الخدمات.
                            </div>
                        )}

                        {!isLoading && !isFetching && !isError && brands.map((brand) => (
                            <button
                                key={brand.id}
                                className="w-full px-6 py-5 flex items-center justify-between hover:bg-app-bg active:bg-app-card/50 transition-colors border-b border-app-card/10 group"
                                onClick={() => {
                                    onNavigate(`/brand/${brand.id}`); // ✅ brandId = serviceId
                                    onClose();
                                }}
                            >
                                <span className="text-sm font-medium text-app-text font-alexandria">{brand.name}</span>
                                <ChevronLeft size={18} className="text-app-gold opacity-50 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>

                    <div className="px-6 mt-6 space-y-3">
                        <button
                            onClick={() => { onNavigate("/account"); onClose(); }}
                            className="w-full py-3.5 rounded-xl border border-app-gold text-app-gold font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <User size={18} />
                            <span>حسابي</span>
                        </button>

                        <button
                            onClick={() => { onNavigate("/technician/online"); onClose(); }}
                            className="w-full py-3.5 rounded-xl bg-app-gold text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md shadow-app-gold/20"
                        >
                            <Video size={18} />
                            <span>حجز التكنك أونلاين ( المرة الأولى مجانا )</span>
                        </button>

                        <button
                            onClick={() => {
                                window.open("https://google.com", "_blank", "noreferrer");
                                onClose();
                            }}
                            className="w-full py-3.5 rounded-xl border border-app-gold text-app-gold font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <ShoppingBag size={18} />
                            <span>شراء منتجات ترندي هير</span>
                        </button>
                    </div>

                    <div className="mt-6 px-8 pb-4">
                        <div className="flex items-center justify-center gap-6">
                            {/* icons */}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-app-card/30 bg-app-bg/30">
                    <a
                        href="https://raiyansoft.net"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-app-textSec text-center font-alexandria block hover:opacity-70 active:opacity-50 transition-opacity"
                    >
                        powered by raiyansoft
                    </a>
                </div>
            </div>
        </div>
    );
}
