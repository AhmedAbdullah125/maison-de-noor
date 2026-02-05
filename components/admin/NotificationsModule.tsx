
import React, { useState, useMemo } from 'react';
import { Send, History, ExternalLink, User, CheckCircle2, XCircle, ChevronLeft, ChevronRight, X, Info } from 'lucide-react';
import { db } from '../../services/db';
import { NotificationOutbox } from '../../types';
import { translations, Locale } from '../../services/i18n';

interface NotificationsModuleProps {
   lang: Locale;
}

const NotificationsModule: React.FC<NotificationsModuleProps> = ({ lang }) => {
   const t = translations[lang];
   const [dbData, setDbData] = useState(db.getData());
   const [message, setMessage] = useState('');
   const [link, setLink] = useState('');
   const [isSending, setIsSending] = useState(false);
   const [lastSent, setLastSent] = useState<NotificationOutbox | null>(null);
   const [selectedOutbox, setSelectedOutbox] = useState<NotificationOutbox | null>(null);

   const isValid = useMemo(() => {
      if (message.trim().length < 3) return false;
      if (link && !link.match(/^https?:\/\/.+/)) return false;
      return true;
   }, [message, link]);

   const handleSend = () => {
      if (!isValid) return;
      setIsSending(true);
      setLastSent(null);

      // Simulate sending time
      setTimeout(() => {
         const result = db.sendNotificationToAll(message, link, 'admin_1', 'Super Admin');
         setLastSent(result);
         setDbData({ ...db.getData() });
         setIsSending(false);
         setMessage('');
         setLink('');
      }, 1500);
   };

   const handleDelete = (id: string) => {
      if (confirm(t.confirmDelete)) {
         db.deleteNotificationFromOutbox(id);
         setDbData({ ...db.getData() });
      }
   };

   return (
      <div className="space-y-8 animate-fadeIn">

         {/* 1. Send Notification Form */}
         <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
               <Send size={24} className="text-[#483383]" />
               {t.sendNotification}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-2">{t.notificationText}</label>
                     <textarea
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] h-32 resize-none"
                        placeholder="Type your broadcast message here..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-2">{t.linkUrl}</label>
                     <input
                        type="url"
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383]"
                        placeholder="https://example.com/promotion"
                        value={link}
                        onChange={e => setLink(e.target.value)}
                     />
                  </div>
                  <button
                     onClick={handleSend}
                     disabled={!isValid || isSending}
                     className="w-full bg-[#483383] text-white font-semibold py-4 rounded-2xl shadow-lg shadow-[#483383]/20 active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                     {isSending ? (
                        <>
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                           <span>{t.sending}</span>
                        </>
                     ) : (
                        <>
                           <Send size={20} />
                           <span>{t.sendNow}</span>
                        </>
                     )}
                  </button>
               </div>

               {/* Quick Results Panel */}
               <div className="flex flex-col justify-center">
                  {lastSent ? (
                     <div className="bg-green-50 border border-green-100 rounded-[2rem] p-8 animate-scaleIn text-center">
                        <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                           <CheckCircle2 size={32} />
                        </div>
                        <h4 className="text-lg font-semibold text-green-700 mb-2">{t.results}</h4>
                        <div className="grid grid-cols-3 gap-4 mt-6">
                           <div className="bg-white p-4 rounded-2xl shadow-sm">
                              <span className="block text-[10px] font-semibold text-gray-400 uppercase">{t.successful}</span>
                              <span className="text-base font-semibold text-green-600">{lastSent.successCount}</span>
                           </div>
                           <div className="bg-white p-4 rounded-2xl shadow-sm">
                              <span className="block text-[10px] font-semibold text-gray-400 uppercase">{t.failed}</span>
                              <span className="text-base font-semibold text-red-500">{lastSent.failCount}</span>
                           </div>
                           <div className="bg-white p-4 rounded-2xl shadow-sm">
                              <span className="block text-[10px] font-semibold text-gray-400 uppercase">{t.total}</span>
                              <span className="text-base font-semibold text-gray-900">{lastSent.totalUsers}</span>
                           </div>
                        </div>
                     </div>
                  ) : (
                     <div className="bg-gray-50 border border-dashed border-gray-200 rounded-[2rem] p-12 text-center text-gray-400 flex flex-col items-center">
                        <Info size={40} className="mb-4 opacity-20" />
                        <p className="text-sm font-semibold max-w-xs leading-loose">
                           Your results summary will appear here after the notification is sent.
                        </p>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* 2. History Table */}
         <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 flex flex-col">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
               <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                  <History size={24} className="text-[#483383]" />
                  {t.history}
               </h3>
            </div>

            <div className="overflow-x-auto no-scrollbar">
               <table className="w-full text-start">
                  <thead className="bg-gray-50 border-b border-gray-100">
                     <tr>
                        <th className="px-8 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.time}</th>
                        <th className="px-8 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.notificationText}</th>
                        <th className="px-8 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.hasLink}</th>
                        <th className="px-8 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.sentBy}</th>
                        <th className="px-8 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.results}</th>
                        <th className={`px-8 py-4 text-xs font-semibold text-gray-400 uppercase ${lang === 'ar' ? 'text-start' : 'text-end'}`}>{t.actions}</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {dbData.notifications_outbox.map((n) => (
                        <tr key={n.id} className="hover:bg-gray-50 transition-colors">
                           <td className="px-8 py-4">
                              <span className="text-xs font-semibold text-gray-900" dir="ltr">{new Date(n.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB')}</span>
                           </td>
                           <td className="px-8 py-4">
                              <p className="text-xs font-normal text-gray-600 truncate max-w-xs">{n.messageText}</p>
                           </td>
                           <td className="px-8 py-4">
                              {n.linkUrl ? <ExternalLink size={14} className="text-[#483383]" /> : <span className="text-xs text-gray-300">-</span>}
                           </td>
                           <td className="px-8 py-4">
                              <span className="text-xs font-semibold text-gray-900">{n.sentByAdminName}</span>
                           </td>
                           <td className="px-8 py-4">
                              <div className="flex gap-2">
                                 <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">{n.successCount}</span>
                                 <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded">{n.failCount}</span>
                              </div>
                           </td>
                           <td className={`px-8 py-4 ${lang === 'ar' ? 'text-start' : 'text-end'}`}>
                              <div className={`flex items-center gap-2 ${lang === 'ar' ? 'justify-start' : 'justify-end'}`}>
                                 <button onClick={() => setSelectedOutbox(n)} className="text-xs font-semibold text-[#483383] hover:underline">{t.viewAll}</button>
                                 <button onClick={() => handleDelete(n.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><X size={16} /></button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
               {dbData.notifications_outbox.length === 0 && (
                  <div className="py-20 text-center text-gray-400 font-semibold">{t.noNotifications}</div>
               )}
            </div>
         </div>

         {/* Details Modal */}
         {selectedOutbox && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fadeIn">
               <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[85vh]">
                  <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                     <h3 className="text-lg font-semibold text-gray-900">{t.outboxDetails}</h3>
                     <button onClick={() => setSelectedOutbox(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
                     <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 leading-relaxed bg-white p-5 rounded-2xl border border-gray-100">
                           {selectedOutbox.messageText}
                        </p>
                        {selectedOutbox.linkUrl && (
                           <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#483383]">
                              <ExternalLink size={14} />
                              <a href={selectedOutbox.linkUrl} target="_blank" rel="noreferrer" className="underline">{selectedOutbox.linkUrl}</a>
                           </div>
                        )}
                     </div>

                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                           <span className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">{t.total}</span>
                           <span className="text-base font-semibold text-gray-900">{selectedOutbox.totalUsers}</span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                           <span className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">{t.successful}</span>
                           <span className="text-base font-semibold text-green-600">{selectedOutbox.successCount}</span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                           <span className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">{t.failed}</span>
                           <span className="text-base font-semibold text-red-500">{selectedOutbox.failCount}</span>
                        </div>
                        <div className="bg-[#100F19] p-4 rounded-2xl shadow-sm text-center">
                           <span className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">{t.successRate}</span>
                           <span className="text-base font-semibold text-white">{((selectedOutbox.successCount / selectedOutbox.totalUsers) * 100).toFixed(0)}%</span>
                        </div>
                     </div>

                     <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-4">{t.deliveryStatus}</h4>
                        <div className="space-y-2">
                           {selectedOutbox.results.map((r, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400"><User size={14} /></div>
                                    <span className="text-xs font-semibold text-gray-900">{r.userName}</span>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    {r.errorReason && <span className="text-[10px] font-semibold text-red-400">{r.errorReason}</span>}
                                    {r.status === 'success' ? (
                                       <div className="bg-green-100 text-green-600 p-1 rounded-full"><CheckCircle2 size={14} /></div>
                                    ) : (
                                       <div className="bg-red-100 text-red-500 p-1 rounded-full"><XCircle size={14} /></div>
                                    )}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="p-8 border-t border-gray-100 shrink-0">
                     <button onClick={() => setSelectedOutbox(null)} className="w-full py-4 bg-gray-100 text-gray-900 font-semibold rounded-2xl hover:bg-gray-200 transition-colors">{t.close}</button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default NotificationsModule;
