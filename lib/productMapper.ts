import { Product } from '../types';

interface ApiProduct {
    id: number;
    name: string;
    sku: string;
    description: string;
    main_image: string;
    price: number;
    discounted_price: number | null;
    current_price: number;
    has_discount: boolean;
    quantity: number;
    in_stock: boolean;
    stock_status: string;
    brand: {
        id: number;
        name: string;
        image: string;
        position: number;
        is_active: number;
    };
    category: {
        id: number;
        name: string;
        image: string;
        position: number;
        is_active: number;
    };
    is_favorite: boolean;
    is_active: boolean;
    is_recently: boolean;
}

/**
 * Transforms an API product to match the component Product type
 */
export const mapApiProductToComponent = (apiProduct: ApiProduct): Product => {
    return {
        id: apiProduct.id,
        name: apiProduct.name,
        description: apiProduct.description,
        price: `${apiProduct.current_price.toFixed(3)} د.ك`,
        oldPrice: apiProduct.has_discount && apiProduct.price
            ? `${apiProduct.price.toFixed(3)} د.ك`
            : undefined,
        image: apiProduct.main_image,
        category: {
            id: apiProduct.category.id,
            name: apiProduct.category.name,
            image: apiProduct.category.image,
            is_active: apiProduct.category.is_active,
            position: apiProduct.category.position,
        },
    };
};

/**
 * Transforms an array of API products
 */
export const mapApiProductsToComponent = (apiProducts: ApiProduct[]): Product[] => {
    return apiProducts.map(mapApiProductToComponent);
};
