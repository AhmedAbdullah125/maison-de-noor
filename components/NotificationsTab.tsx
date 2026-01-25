import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import AppHeader from './AppHeader';

const NotificationsTab: React.FC = () => {
  const [isEmpty, setIsEmpty] = useState(true);

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fadeIn bg-app-bg">
      <AppHeader title="التنبيهات" />
      
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-28 pt-24">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60 pb-10">
            <div className="w-24 h-24 bg-app-card rounded-full flex items-center justify-center mb-6 text-app-gold">
              <Bell size={40} />
            </div>
            <h2 className="text-lg font-bold text-app-text mb-2">لا توجد تنبيهات حالياً</h2>
            <p className="text-sm text-app-textSec">سنقوم بإعلامك بآخر العروض والتحديثات هنا</p>
          </div>
        ) : (
          <div className="space-y-4">
             {/* Notifs Content */}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsTab;