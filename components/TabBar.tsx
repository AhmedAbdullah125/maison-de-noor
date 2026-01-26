
import React, { useMemo } from 'react';
import { Home, Bell, Calendar, User, Ticket } from 'lucide-react';
import { TabId } from '../types';

interface TabBarProps {
  currentTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TabBar: React.FC<TabBarProps> = ({ currentTab, onTabChange }) => {
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'الرئيسية', icon: <Home size={22} /> },
    { id: 'subscriptions', label: 'اشتراكاتي', icon: <Ticket size={22} /> },
    { id: 'notifications', label: 'التنبيهات', icon: <Bell size={22} /> },
    { id: 'appointments', label: 'مواعيدي', icon: <Calendar size={22} /> },
    { id: 'account', label: 'الحساب', icon: <User size={22} /> },
  ];

  const activeIndex = useMemo(() => {
    const idx = tabs.findIndex(tab => tab.id === currentTab);
    return idx === -1 ? 0 : idx;
  }, [currentTab]);

  return (
    <div className="absolute bottom-0 left-0 w-full bg-app-bg border-t border-app-card pb-safe pt-2 px-4 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-50">
      <div className="flex justify-between items-end pb-2 md:pb-4 mx-auto relative w-full">

        {/* Animated Active Background Pill */}
        <div
          className="absolute top-0 bottom-2 md:bottom-4 transition-[right] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
          style={{
            width: '20%',
            right: `${activeIndex * 20}%`
          }}
        >
          <div className="mx-auto w-[85%] h-full bg-app-gold/10 rounded-[20px]" />
        </div>

        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button key={tab.id} onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center gap-1.5 transition-all duration-300 w-1/5 group outline-none z-10"
            >
              <div
                className={`
                  relative flex items-center justify-center p-2 rounded-full transition-all duration-300
                  ${isActive
                    ? 'text-app-gold transform scale-110'
                    : 'text-gray-400 hover:text-gray-500'
                  }
                `}
              >
                {tab.icon}
              </div>
              <span
                className={`text-[10px] transition-colors pb-2 duration-300 ${isActive ? 'text-app-gold font-semibold' : 'text-gray-400 font-normal'
                  }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabBar;
