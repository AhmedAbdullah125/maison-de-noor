
import React, { useEffect, useState } from 'react';
import { Ticket, Loader2 } from 'lucide-react';
import { translations, Locale } from '../../services/i18n';
import { getSubscriptions, SubscriptionItem } from '../services/getSubscriptions';

interface ActiveSubscriptionsModuleProps {
  lang: Locale;
}

const ActiveSubscriptionsModule: React.FC<ActiveSubscriptionsModuleProps> = ({ lang }) => {
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
    const result = await getSubscriptions('active', lang, currentPage);

    if (result.ok) {
      setSubscriptions(result.data);
      setTotalPages(result.pagination.meta.last_page);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <h2 className="text-xl font-semibold text-gray-900">{t.activeSubscriptions}</h2>
        <div className="bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-sm flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <h2 className="text-xl font-semibold text-gray-900">{t.activeSubscriptions}</h2>
        <div className="bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6">
            <Ticket size={40} />
          </div>
          <p className="text-gray-400 font-semibold">{t.noContentYet}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-xl font-semibold text-gray-900">{t.activeSubscriptions}</h2>

      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-start py-4 px-4 text-sm font-semibold text-gray-700">{t.orderNumber}</th>
                <th className="text-start py-4 px-4 text-sm font-semibold text-gray-700">{t.service}</th>
                <th className="text-start py-4 px-4 text-sm font-semibold text-gray-700">{t.subscription}</th>
                <th className="text-start py-4 px-4 text-sm font-semibold text-gray-700">{t.sessions}</th>
                <th className="text-start py-4 px-4 text-sm font-semibold text-gray-700">{t.date}</th>
                <th className="text-start py-4 px-4 text-sm font-semibold text-gray-700">{t.finalPrice}</th>
                <th className="text-start py-4 px-4 text-sm font-semibold text-gray-700">{t.status}</th>
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
                      <span className="text-green-600">{subscription.completed_sessions} {t.completedSessions}</span>
                      <span className="text-orange-600">{subscription.remaining_sessions} {t.remainingSessions}</span>
                      <span className="text-gray-500 text-xs">{t.outOf} {subscription.session_count}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    <div>{subscription.start_date}</div>
                    <div className="text-xs text-gray-500">{subscription.start_time}</div>
                  </td>
                  <td className="py-4 px-4 text-sm font-semibold text-gray-900">{subscription.final_price} د.ك</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${subscription.payment_status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                      }`}>
                      {subscription.payment_status === 'paid' ? t.paid : t.pending}
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
              {t.prev}
            </button>
            <span className="text-sm text-gray-700">
              {t.page} {currentPage} {t.of} {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.next}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveSubscriptionsModule;
