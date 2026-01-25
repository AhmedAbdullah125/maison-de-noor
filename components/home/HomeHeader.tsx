// src/components/home/HomeHeader.tsx
import React from "react";
import { Menu } from "lucide-react";
import AppHeader from "../AppHeader";
import AppImage from "../AppImage";

interface Props {
    onMenuClick: () => void;
    onTitleClick: () => void;
}

export default function HomeHeader({ onMenuClick, onTitleClick }: Props) {
    return (
        <AppHeader
            actionStart={
                <button
                    onClick={onMenuClick}
                    className="p-2 text-app-text hover:bg-app-card rounded-full transition-colors flex-shrink-0"
                >
                    <Menu size={24} />
                </button>
            }
            title={
                <div className="flex items-center justify-center gap-2 px-2 cursor-pointer w-full" onClick={onTitleClick}>
                    <AppImage
                        src="https://raiyansoft.com/wp-content/uploads/2025/12/fav.png"
                        alt="Mezo Do Noor logo"
                        className="h-7 w-7 object-contain"
                    />
                    <span className="text-xl font-bold text-app-text font-alexandria truncate">ميزو دو نور</span>
                </div>
            }
        />
    );
}
