
import React from 'react';
import { Ticket } from 'lucide-react';
import { translations, Locale } from '../../services/i18n';

interface ExpiredSubscriptionsModuleProps {
  lang: Locale;
}

const ExpiredSubscriptionsModule: React.FC<ExpiredSubscriptionsModuleProps> = ({ lang }) => {
  const t = translations[lang];

  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-xl font-bold text-gray-900">{t.expiredSubscriptions}</h2>

      <div className="bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-6">
          <Ticket size={40} />
        </div>
        <p className="text-gray-400 font-semibold">{t.noContentYet}</p>
      </div>
    </div>
  );
};

export default ExpiredSubscriptionsModule;
