// src/components/home/CategoryProductsView.tsx
import React from "react";
import { ArrowRight } from "lucide-react";
import { Product, ServiceAddon, ServicePackageOption } from "../../types";
import ProductCard from "../ProductCard";

interface Props {
    title: string;
    products: Product[];
    favourites: number[];
    onBack: () => void;
    onToggleFavourite: (id: number) => void;
    onBook: (product: Product, quantity: number, selectedAddons?: ServiceAddon[], pkg?: ServicePackageOption, customFinalPrice?: number) => void;
    onProductClick: (product: Product) => void;
}

export default function CategoryProductsView({
    title,
    products,
    favourites,
    onBack,
    onToggleFavourite,
    onBook,
    onProductClick,
}: Props) {
    return (
        <div className="animate-fadeIn pt-2">
            <div className="px-6 mb-6 flex items-center gap-2">
                <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm text-app-text hover:bg-app-card transition-colors">
                    <ArrowRight size={20} />
                </button>
                <h2 className="text-lg font-bold text-app-text font-alexandria truncate">{title}</h2>
            </div>

            <div className="px-6 grid grid-cols-2 gap-4">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        isFavourite={favourites.includes(product.id)}
                        onToggleFavourite={onToggleFavourite}
                        onBook={onBook}
                        onClick={onProductClick}
                    />
                ))}
            </div>
        </div>
    );
}
