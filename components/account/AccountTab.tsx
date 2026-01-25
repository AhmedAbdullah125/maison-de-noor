import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";

import { Order } from "../../App";
import { Product, ServiceAddon } from "../../types";
import { DEMO_PRODUCTS } from "../../constants";

import ReviewsTab from "../ReviewsTab";
import SubscriptionsTab from "../SubscriptionsTab";

import { useGetProfile } from "../services/useGetProfile";
import { useUpdateProfile } from "../services/useUpdateProfile";
import { deleteAccountRequest } from "../services/deleteAccount";
import { clearAuth, isLoggedIn } from "../auth/authStorage";
import AccountMenu from "./AccountMenu";
import EditProfileScreen from "./EditProfileScreen";
import HistoryScreen from "./HistoryScreen";
import OrderDetailsScreen from "./OrderDetailsScreen";
import FavoritesScreen from "./FavoritesScreen";
import ProductDetailsScreen from "./ProductDetailsScreen";
import DeleteAccountModal from "./DeleteAccountModal";

interface AccountTabProps {
    orders: Order[];
    onNavigateToHome: () => void;
    initialOrderId?: string | null;
    onClearInitialOrder?: () => void;
    favourites: number[];
    onToggleFavourite: (productId: number) => void;
    onBook: (product: Product, quantity: number, selectedAddons?: ServiceAddon[]) => void;
    onLogout: () => void;
    isGuest?: boolean;
    lang?: string;
}

const AccountTab: React.FC<AccountTabProps> = ({
    orders,
    onNavigateToHome,
    initialOrderId,
    onClearInitialOrder,
    favourites,
    onToggleFavourite,
    onBook,
    onLogout,
    isGuest = false,
    lang = "ar",
}) => {
    const navigate = useNavigate();

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isHairProfileComplete, setIsHairProfileComplete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // ✅ profile
    const shouldLoadProfile = !isGuest && isLoggedIn();
    const profileQuery = useGetProfile(lang);
    const profile = shouldLoadProfile ? profileQuery.data : null;

    // ✅ update profile mutation (pass to EditProfileScreen)
    const updateMut = useUpdateProfile(lang);

    // ✅ favorites list (demo source in your code)
    const favoriteProducts = useMemo(() => {
        return DEMO_PRODUCTS.filter((p) => favourites.includes(p.id));
    }, [favourites]);

    // ✅ deep-link initial order
    useEffect(() => {
        if (!initialOrderId) return;
        const order = orders.find((o) => o.id === initialOrderId);
        if (!order) return;
        navigate(`/account/order/${order.id}`);
        onClearInitialOrder?.();
    }, [initialOrderId, orders, onClearInitialOrder, navigate]);

    // ✅ hair profile status
    useEffect(() => {
        const p = localStorage.getItem("mezo_hair_profile");
        setIsHairProfileComplete(!!p);
    }, []);

    const handleAuthButton = () => {
        if (isGuest || !isLoggedIn()) {
            navigate("/login");
            return;
        }
        clearAuth();
        onLogout?.();
        navigate("/login", { replace: true });
    };

    const handleConfirmDelete = async () => {
        if (isDeleting) return;
        setIsDeleting(true);

        const res = await deleteAccountRequest(lang);

        setIsDeleting(false);

        if (res.ok) {
            setShowDeleteModal(false);
            clearAuth();
            onLogout?.();
            navigate("/login", { replace: true });
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-app-bg relative">
            <Routes>
                <Route
                    index
                    element={
                        <AccountMenu
                            isGuest={isGuest}
                            profile={profile}
                            profileLoading={!isGuest && profileQuery.isLoading}
                            isHairProfileComplete={isHairProfileComplete}
                            onAuthClick={handleAuthButton}
                            onOpenEdit={() => navigate("/account/edit")}
                            onOpenFavorites={() => navigate("/account/favorites")}
                            onOpenHistory={() => navigate("/account/history")}
                            onOpenReviews={() => navigate("/account/reviews")}
                            onOpenHairProfile={() => navigate("/hair-profile")}
                            onOpenDelete={() => setShowDeleteModal(true)}
                        />
                    }
                />

                <Route
                    path="edit"
                    element={
                        <EditProfileScreen
                            profile={profile}
                            isGuest={isGuest}
                            lang={lang}
                            onBack={() => navigate("/account")}
                            onSaved={() => navigate("/account")}
                            updateMut={updateMut}
                        />
                    }
                />

                <Route
                    path="history"
                    element={
                        <HistoryScreen
                            orders={orders}
                            onBack={() => navigate("/account")}
                            onNavigateToHome={onNavigateToHome}
                            onOpenOrder={(id) => navigate(`/account/order/${id}`)}
                        />
                    }
                />

                <Route
                    path="order/:orderId"
                    element={<OrderDetailsRoute orders={orders} onBack={() => navigate("/account/history")} />}
                />

                <Route
                    path="favorites"
                    element={
                        <FavoritesScreen
                            onBack={() => navigate("/account")}
                            onNavigateToHome={onNavigateToHome}
                            onBook={onBook}
                            onOpenProduct={(id) => navigate(`/account/favorites/product/${id}`)}
                            lang={lang}
                        />
                    }
                />

                <Route
                    path="favorites/product/:productId"
                    element={
                        <ProductDetailsRoute
                            onBack={() => navigate("/account/favorites")}
                            onBook={onBook}
                        />
                    }
                />

                <Route path="reviews" element={<ReviewsTab />} />
                <Route path="subscriptions" element={<SubscriptionsTab />} />
            </Routes>

            {showDeleteModal && (
                <DeleteAccountModal
                    isDeleting={isDeleting}
                    onCancel={() => setShowDeleteModal(false)}
                    onConfirm={handleConfirmDelete}
                />
            )}
        </div>
    );
};

export default AccountTab;

// --- small route wrappers to read URL params ---
function OrderDetailsRoute({
    orders,
    onBack,
}: {
    orders: Order[];
    onBack: () => void;
}) {
    const { orderId } = useParams();
    const selected = orders.find((o) => o.id === orderId);
    return <OrderDetailsScreen order={selected || null} onBack={onBack} />;
}

function ProductDetailsRoute({
    onBack,
    onBook,
}: {
    onBack: () => void;
    onBook: (product: Product, quantity: number, selectedAddons?: ServiceAddon[]) => void;
}) {
    const { productId } = useParams();
    const selected = DEMO_PRODUCTS.find((p) => p.id === Number(productId));
    return <ProductDetailsScreen product={selected || null} onBack={onBack} onBook={onBook} />;
}
