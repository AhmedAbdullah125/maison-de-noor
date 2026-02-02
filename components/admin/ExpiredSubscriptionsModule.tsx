
import React, { useEffect, useState } from 'react';
import { Ticket, Loader2 } from 'lucide-react';
import { translations, Locale } from '../../services/i18n';
import { getSubscriptions, SubscriptionItem } from '../services/getSubscriptions';

interface ExpiredSubscriptionsModuleProps {
  lang: Locale;
}

const ExpiredSubscriptionsModule: React.FC<ExpiredSubscriptionsModuleProps> = ({ lang }) => {
  const t = translations[lang];
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchSubscriptions();
  }, [currentPage, lang]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    const result = await getSubscriptions('inactive', lang, currentPage);

    if (result.ok) {
      setSubscriptions(result.data);
      setTotalPages(result.pagination.meta.last_page);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <h2 className="text-xl font-bold text-gray-900">{t.expiredSubscriptions}</h2>
        <div className="bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-sm flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (subscriptions.length === 0) {
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
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-xl font-bold text-gray-900">{t.expiredSubscriptions}</h2>

      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700">رقم الطلب</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700">الخدمة</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700">الاشتراك</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700">الجلسات</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700">التاريخ</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700">السعر النهائي</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 text-sm text-gray-900">{subscription.request_number}</td>
                  <td className="py-4 px-4 text-sm text-gray-900">{subscription.service || '-'}</td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{subscription.subscription_name || '-'}</div>
                      {subscription.subscription_description && (
                        <div className="text-xs text-gray-500 mt-1">{subscription.subscription_description}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    <div className="flex flex-col gap-1">
                      <span className="text-green-600">{subscription.completed_sessions} مكتملة</span>
                      <span className="text-red-600">{subscription.remaining_sessions} متبقية</span>
                      <span className="text-gray-500 text-xs">من {subscription.session_count}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    <div>{subscription.start_date}</div>
                    <div className="text-xs text-gray-500">{subscription.start_time}</div>
                  </td>
                  <td className="py-4 px-4 text-sm font-semibold text-gray-900">{subscription.final_price} د.ك</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      منتهي
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              السابق
            </button>
            <span className="text-sm text-gray-700">
              صفحة {currentPage} من {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpiredSubscriptionsModule;
