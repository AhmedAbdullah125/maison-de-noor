import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Search, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import AppImage from './AppImage';
import AppHeader from './AppHeader';
import { useGetServiceByCategory } from './services/useGetServiceByCategory';
import { useGetLookups } from './services/useGetLookups';

interface BrandPageProps {
  onBook: (product: Product, quantity: number) => void;
  favourites: number[];
  onToggleFavourite: (productId: number) => void;
}

const BrandPage: React.FC<BrandPageProps> = ({ onBook, favourites, onToggleFavourite }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { brandId } = useParams();

  const [page, setPage] = useState(1);

  const { data, isLoading, isError, isFetching, error } =
    useGetServiceByCategory("ar", brandId, page);

  const lookupsQuery = useGetLookups("ar");

  const unauthorized = (error as any)?.isUnauthorized === true;

  // ✅ always run effect (no early return before hooks below)
  useEffect(() => {
    if (unauthorized) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
    }
  }, [unauthorized, navigate, location.pathname]);

  // ✅ hooks that were after return must be BEFORE any conditional return
  const services = useMemo(() => data?.services ?? [], [data]);
  const pagination = data?.pagination;

  const brandInfo = useMemo(() => {
    const categories = lookupsQuery.data?.categories ?? [];
    const category = categories.find((cat: any) => cat.id === Number(brandId));

    const first = services?.[0];
    const cat = first?.category;

    return {
      name: category?.name || cat?.name || "القسم",
      image: category?.image || "",
    };
  }, [services, lookupsQuery.data, brandId]);

  const mappedProducts: Product[] = useMemo(() => {
    return services.map((s: any) => {
      const currentPrice =
        typeof s.current_price === "number"
          ? s.current_price
          : Number(s.current_price ?? s.price ?? 0);

      const basePrice =
        typeof s.price === "number" ? s.price : Number(s.price ?? 0);

      return {
        id: s.id,
        name: s.name,
        description: s.description,
        image: s.main_image,
        price: currentPrice,
        current_price: currentPrice,
        oldPrice: s.has_discount ? basePrice : undefined,
        category: s.category,
        type: s.type,
        has_discount: s.has_discount,
        discounted_price: s.discounted_price,
        options: s.options ?? [],
        subscriptions: s.subscriptions ?? [],
        is_favorite: s.is_favorite,
      } as any as Product;
    });
  }, [services]);

  // ✅ now it's safe to return (after ALL hooks)
  if (unauthorized) return null;

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.id}`, { state: { from: location.pathname } });
  };

  const handleBack = () => navigate('/');

  const isEmpty = !isLoading && !isFetching && !isError && mappedProducts.length === 0;

  // ✅ treat real errors only (exclude unauthorized)
  const isRealError = isError && !unauthorized;

  if (isRealError) {
    return (
      <div className="flex flex-col h-full bg-app-bg items-center justify-center p-6 text-center font-amiri">
        <div className="w-20 h-20 bg-app-card rounded-full flex items-center justify-center mb-6">
          <Search size={40} className="text-app-textSec" />
        </div>
        <h2 className="text-lg font-semibold text-app-text mb-4">حدث خطأ أثناء تحميل القسم</h2>
        <button
          onClick={() => navigate('/')}
          className="bg-app-gold text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2"
        >
          <Home size={18} />
          <span>العودة للرئيسية</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-app-bg relative font-amiri overflow-hidden">
      <AppHeader title={brandInfo.name} onBack={handleBack} />

      <main className="flex-1 overflow-y-auto w-full pb-28 px-6 pt-24">
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 rounded-[2rem] bg-white shadow-md border border-app-card/30 overflow-hidden mb-4 p-2">
            <AppImage
              src={brandInfo.image}
              alt={brandInfo.name}
              className="w-full h-full object-cover rounded-[1.5rem]"
            />
          </div>
          <h2 className="text-xl font-semibold text-app-text">{brandInfo.name}</h2>
        </div>

        <div className="mb-6">
          <h3 className="text-base font-semibold text-app-text mb-4 text-right">
            خدمات {brandInfo.name}
          </h3>

          {(isLoading || isFetching) && (
            <div className="text-center py-10 text-app-textSec bg-white rounded-2xl border border-app-card/30">
              <p>جاري تحميل الخدمات...</p>
            </div>
          )}

          {isEmpty && (
            <div className="text-center py-10 text-app-textSec bg-white rounded-2xl border border-app-card/30">
              <p>لا توجد خدمات متوفرة حالياً لهذا القسم.</p>
            </div>
          )}

          {mappedProducts.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                {mappedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavourite={favourites.includes(product.id)}
                    onBook={onBook}
                    onClick={handleProductClick}
                  />
                ))}
              </div>

              {pagination && pagination.total_pages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-4 py-2 rounded-xl bg-white border border-app-card/30 text-app-text disabled:opacity-50 flex items-center gap-2"
                  >
                    <ChevronRight size={18} />
                    السابق
                  </button>

                  <span className="text-sm text-app-textSec">
                    صفحة {pagination.current_page} من {pagination.total_pages}
                  </span>

                  <button
                    disabled={page >= pagination.total_pages}
                    onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                    className="px-4 py-2 rounded-xl bg-white border border-app-card/30 text-app-text disabled:opacity-50 flex items-center gap-2"
                  >
                    التالي
                    <ChevronLeft size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default BrandPage;
