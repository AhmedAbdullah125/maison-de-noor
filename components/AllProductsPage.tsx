import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Product } from '../types';
import { DEMO_PRODUCTS } from '../constants';
import ProductCard from './ProductCard';
import AppHeader from './AppHeader';

interface AllProductsPageProps {
  onBook: (product: Product, quantity: number) => void;
  favourites: number[];
  onToggleFavourite: (productId: number) => void;
}

const AllProductsPage: React.FC<AllProductsPageProps> = ({
  onBook,
  favourites,
  onToggleFavourite
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.id}`, { state: { from: location.pathname } });
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col h-full bg-app-bg relative font-amiri overflow-hidden">
      {/* Header */}
      <AppHeader
        title="جميع الخدمات"
        onBack={handleBack}
      />

      {/* Content */}
      <main className="flex-1 overflow-y-auto w-full pb-28 px-6 pt-24">
        <div className="grid grid-cols-2 gap-4">
          {DEMO_PRODUCTS.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              isFavourite={favourites.includes(product.id)}
              onBook={onBook}
              onClick={handleProductClick}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default AllProductsPage;