import React, { useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Search, Home } from "lucide-react";
import { Product } from "../types";
import ProductCard from "./ProductCard";
import AppImage from "./AppImage";
import AppHeader from "./AppHeader";
import { useGetService } from "./services/useGetService";

interface BrandPageProps {
  onBook: (product: Product, quantity: number) => void;
  favourites: number[];
  onToggleFavourite: (productId: number) => void;

  // ✅ add
  lang: string;
}

function toMoneyKwd(value: number | null | undefined) {
  if (typeof value !== "number") return "0.000 د.ك";
  return `${value.toFixed(3)} د.ك`;
}

// ✅ Mapper: API Service -> Product (على قد ما ProductCard محتاج)
function mapApiServiceToProduct(s: any): Product {
  const current = typeof s.current_price === "number" ? s.current_price : (typeof s.price === "number" ? s.price : 0);
  const hasDiscount = !!s.has_discount && typeof s.price === "number" && s.price > current;

  return {
    id: s.id,
    name: s.name,
    description: s.description,
    image: s.main_image,
    images: s.images && Array.isArray(s.images) ? s.images : undefined,

    // ProductCard بيعرض product.price كـ string
    price: toMoneyKwd(current),

    // oldPrice اختياري
    oldPrice: hasDiscount ? toMoneyKwd(s.price) : undefined,
  } as unknown as Product;
}

const BrandPage: React.FC<BrandPageProps> = ({ onBook, favourites, onToggleFavourite, lang = "ar" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { brandId } = useParams();

  const { data, isLoading, isError } = useGetService(lang, brandId);

  const brand = data; // parent service
  const brandProducts = useMemo(() => {
    const subs = brand?.sub_services ?? [];
    return subs.map(mapApiServiceToProduct);
  }, [brand]);

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.id}`, { state: { from: location.pathname } });
  };

  const handleBack = () => {
    navigate("/");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-app-bg items-center justify-center p-6 text-center font-alexandria">
        <div className="w-20 h-20 bg-app-card rounded-full flex items-center justify-center mb-6 animate-pulse" />
        <h2 className="text-xl font-bold text-app-text mb-2">جاري التحميل...</h2>
        <p className="text-sm text-app-textSec">بنجهز البيانات دلوقتي</p>
      </div>
    );
  }

  // Not found / error
  if (isError || !brand) {
    return (
      <div className="flex flex-col h-full bg-app-bg items-center justify-center p-6 text-center font-alexandria">
        <div className="w-20 h-20 bg-app-card rounded-full flex items-center justify-center mb-6">
          <Search size={40} className="text-app-textSec" />
        </div>
        <h2 className="text-xl font-bold text-app-text mb-4">القسم غير موجود</h2>
        <button
          onClick={() => navigate("/")}
          className="bg-app-gold text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2"
        >
          <Home size={18} />
          <span>العودة للرئيسية</span>
        </button>
      </div>
    );
  }
  console.log(brand.main_image);
  return (
    <div className="flex flex-col h-full bg-app-bg relative font-alexandria overflow-hidden">
      <AppHeader title={brand.name} onBack={handleBack} />

      <main className="flex-1 overflow-y-auto w-full pb-28 px-6 pt-24">
        {/* Brand Hero */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 rounded-[2rem] bg-white shadow-md border border-app-card/30 overflow-hidden mb-4 p-2">
            <AppImage
              src={brand.main_image}
              alt={brand.name}
              className="w-full h-full object-cover rounded-[1.5rem]"
            />
          </div>
          <h2 className="text-2xl font-bold text-app-text">{brand.name}</h2>
        </div>

        {/* Products */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-app-text mb-4 text-right">خدمات {brand.name}</h3>

          {brandProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {brandProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavourite={favourites.includes(product.id)}
                  onToggleFavourite={onToggleFavourite}
                  onBook={onBook}
                  onClick={handleProductClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-app-textSec bg-white rounded-2xl border border-app-card/30">
              <p>لا توجد خدمات متوفرة حالياً لهذا القسم.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BrandPage;
