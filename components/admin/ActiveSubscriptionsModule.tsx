
import React from 'react';
import { Ticket } from 'lucide-react';
import { translations, Locale } from '../../services/i18n';

interface ActiveSubscriptionsModuleProps {
  lang: Locale;
}

const ActiveSubscriptionsModule: React.FC<ActiveSubscriptionsModuleProps> = ({ lang }) => {
  const t = translations[lang];

  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-black text-gray-900">{t.activeSubscriptions}</h2>
      
      <div className="bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6">
          <Ticket size={40} />
        </div>
        <p className="text-gray-400 font-bold">{t.noContentYet}</p>
      </div>
    </div>
  );
};

export default ActiveSubscriptionsModule;
