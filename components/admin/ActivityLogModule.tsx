
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Calendar, User, Terminal, AlertTriangle, Info, X, ChevronLeft, ChevronRight, Monitor, Globe } from 'lucide-react';
import { db } from '../../services/db';
import { ActivityLog, ActorType, Severity } from '../../types';
import { translations, Locale } from '../../services/i18n';

interface ActivityLogModuleProps {
   lang: Locale;
}

const ActivityLogModule: React.FC<ActivityLogModuleProps> = ({ lang }) => {
   const t = translations[lang];
   const [logs, setLogs] = useState<ActivityLog[]>(db.getData().logs);
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

   // Filters
   const [filters, setFilters] = useState({
      actorType: 'all' as ActorType | 'all',
      severity: 'all' as Severity | 'all',
      dateRange: 'all' as '7' | '30' | '90' | 'all'
   });

   // Pagination
   const [currentPage, setCurrentPage] = useState(1);
   const [rowsPerPage, setRowsPerPage] = useState(25);

   useEffect(() => {
      // Listen for storage changes to sync logs
      const handleStorage = () => {
         setLogs(db.getData().logs);
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
   }, []);

   const filteredLogs = useMemo(() => {
      let result = logs;

      // Search
      if (searchTerm) {
         const lowerSearch = searchTerm.toLowerCase();
         result = result.filter(log =>
            log.actorName.toLowerCase().includes(lowerSearch) ||
            log.actionType.toLowerCase().includes(lowerSearch) ||
            log.details.toLowerCase().includes(lowerSearch) ||
            (log.entityName && log.entityName.toLowerCase().includes(lowerSearch))
         );
      }

      // Actor Type Filter
      if (filters.actorType !== 'all') {
         result = result.filter(log => log.actorType === filters.actorType);
      }

      // Severity Filter
      if (filters.severity !== 'all') {
         result = result.filter(log => log.severity === filters.severity);
      }

      // Date Range Filter
      if (filters.dateRange !== 'all') {
         const days = parseInt(filters.dateRange);
         const cutoff = new Date();
         cutoff.setDate(cutoff.getDate() - days);
         result = result.filter(log => new Date(log.timestamp) >= cutoff);
      }

      return result;
   }, [logs, searchTerm, filters]);

   const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);
   const paginatedLogs = useMemo(() => {
      const start = (currentPage - 1) * rowsPerPage;
      return filteredLogs.slice(start, start + rowsPerPage);
   }, [filteredLogs, currentPage, rowsPerPage]);

   const getSeverityStyles = (sev: Severity) => {
      switch (sev) {
         case 'danger': return 'bg-red-50 text-red-600 border-red-100';
         case 'warning': return 'bg-orange-50 text-orange-600 border-orange-100';
         default: return 'bg-blue-50 text-blue-600 border-blue-100';
      }
   };

   const getSeverityIcon = (sev: Severity) => {
      switch (sev) {
         case 'danger': return <AlertTriangle size={14} />;
         case 'warning': return <AlertTriangle size={14} />;
         default: return <Info size={14} />;
      }
   };

   const formatTimestamp = (ts: string) => {
      const date = new Date(ts);
      return {
         date: date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB'),
         time: date.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-GB', { hour: '2-digit', minute: '2-digit' })
      };
   };

   return (
      <div className="space-y-6 relative h-full flex flex-col">
         {/* Top Controls */}
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
               <div className="relative w-full md:w-96">
                  <input
                     type="text"
                     className={`w-full ${lang === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all`}
                     placeholder={t.searchLogs}
                     value={searchTerm}
                     onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  />
                  <Search className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
               </div>

               <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                     <Filter size={16} className="text-gray-400" />
                     <select
                        className="bg-transparent text-xs font-semibold outline-none cursor-pointer"
                        value={filters.actorType}
                        onChange={e => { setFilters({ ...filters, actorType: e.target.value as any }); setCurrentPage(1); }}
                     >
                        <option value="all">{t.allActors}</option>
                        <option value="admin">{t.admin}</option>
                        <option value="staff">{t.staff}</option>
                        <option value="customer">{t.customer}</option>
                        <option value="system">{t.system}</option>
                     </select>
                  </div>

                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                     <AlertTriangle size={16} className="text-gray-400" />
                     <select
                        className="bg-transparent text-xs font-semibold outline-none cursor-pointer"
                        value={filters.severity}
                        onChange={e => { setFilters({ ...filters, severity: e.target.value as any }); setCurrentPage(1); }}
                     >
                        <option value="all">{t.allSeverities}</option>
                        <option value="info">{t.info}</option>
                        <option value="warning">{t.warning}</option>
                        <option value="danger">{t.danger}</option>
                     </select>
                  </div>

                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                     <Calendar size={16} className="text-gray-400" />
                     <select
                        className="bg-transparent text-xs font-semibold outline-none cursor-pointer"
                        value={filters.dateRange}
                        onChange={e => { setFilters({ ...filters, dateRange: e.target.value as any }); setCurrentPage(1); }}
                     >
                        <option value="all">{t.all}</option>
                        <option value="7">{t.last7Days}</option>
                        <option value="30">{t.last30Days}</option>
                        <option value="90">{t.last90Days}</option>
                     </select>
                  </div>
               </div>
            </div>
         </div>

         {/* Main Table */}
         <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-auto flex flex-col">
            <div className="overflow-x-auto no-scrollbar flex-1">
               <table className="w-full text-start border-collapse">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                     <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start whitespace-nowrap">{t.time}</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start whitespace-nowrap">{t.actor}</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start whitespace-nowrap">{t.action}</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start whitespace-nowrap">{t.entity}</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start whitespace-nowrap">{t.details}</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start whitespace-nowrap">{t.severity}</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {paginatedLogs.map((log) => {
                        const ts = formatTimestamp(log.timestamp);
                        return (
                           <tr
                              key={log.id}
                              onClick={() => setSelectedLog(log)}
                              className="hover:bg-gray-50 transition-colors cursor-pointer group"
                           >
                              <td className="px-6 py-4">
                                 <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-gray-900 whitespace-nowrap" dir="ltr">{ts.date}</span>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap" dir="ltr">{ts.time}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#483383]/10 group-hover:text-[#483383] transition-colors">
                                       <User size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="text-xs font-semibold text-gray-900 whitespace-nowrap">{log.actorName}</span>
                                       <span className="text-[10px] text-gray-400 uppercase font-bold">{t[log.actorType as keyof typeof t] || log.actorType}</span>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-2">
                                    <Terminal size={14} className="text-gray-400" />
                                    <span className="text-xs font-normal text-gray-700 whitespace-nowrap capitalize">{log.actionType.replace('-', ' ')}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-[#483383] whitespace-nowrap">{log.entityType}</span>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">#{log.entityId.slice(-6)}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <p className="text-xs text-gray-500 line-clamp-1 max-w-xs">{log.details}</p>
                              </td>
                              <td className="px-6 py-4">
                                 <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold ${getSeverityStyles(log.severity)}`}>
                                    {getSeverityIcon(log.severity)}
                                    <span className="uppercase">{t[log.severity as keyof typeof t] || log.severity}</span>
                                 </div>
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
               {paginatedLogs.length === 0 && (
                  <div className="py-32 flex flex-col items-center justify-center text-center">
                     <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                        <Terminal size={40} />
                     </div>
                     <p className="text-gray-400 font-semibold">{t.noRecentLogs}</p>
                  </div>
               )}
            </div>

            {/* Footer / Pagination */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                  <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">{t.rowsPerPage}</span>
                  <select
                     className="bg-white border border-gray-200 rounded-lg text-xs font-semibold p-1"
                     value={rowsPerPage}
                     onChange={e => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                  >
                     <option value={25}>25</option>
                     <option value={50}>50</option>
                     <option value={100}>100</option>
                  </select>
               </div>

               <div className="flex items-center gap-2">
                  <button
                     onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                     disabled={currentPage === 1}
                     className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white transition-all"
                  >
                     {lang === 'ar' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                  </button>
                  <span className="text-xs font-bold text-gray-900 px-4 min-w-[100px] text-center">
                     {currentPage} / {totalPages || 1}
                  </span>
                  <button
                     onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                     disabled={currentPage >= totalPages}
                     className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white transition-all"
                  >
                     {lang === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                  </button>
               </div>

               <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                  Total {filteredLogs.length} Records
               </div>
            </div>
         </div>

         {/* Detail Panel Overlay */}
         {selectedLog && (
            <div className="fixed inset-0 z-[110] flex justify-end animate-fadeIn bg-black/20 backdrop-blur-[2px]">
               <div
                  className={`h-full w-full max-w-md bg-white shadow-2xl flex flex-col ${lang === 'ar' ? 'animate-slideLeftRtl' : 'animate-slideRightLtr'}`}
                  onClick={e => e.stopPropagation()}
               >
                  <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                     <h3 className="text-lg font-bold text-gray-900">{t.logDetails}</h3>
                     <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
                     <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                        <div className="flex items-center gap-4 mb-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getSeverityStyles(selectedLog.severity)}`}>
                              {getSeverityIcon(selectedLog.severity)}
                           </div>
                           <div>
                              <h4 className="text-base font-bold text-gray-900">{selectedLog.shortTitle}</h4>
                              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest" dir="ltr">
                                 {selectedLog.id}
                              </span>
                           </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed bg-white p-4 rounded-2xl border border-gray-100">
                           {selectedLog.details}
                        </p>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                           <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{t.time}</span>
                           <div className="flex flex-col" dir="ltr">
                              <span className="text-sm font-bold text-gray-900">{formatTimestamp(selectedLog.timestamp).date}</span>
                              <span className="text-xs text-gray-500">{formatTimestamp(selectedLog.timestamp).time}</span>
                           </div>
                        </div>
                        <div className="space-y-1">
                           <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{t.actor}</span>
                           <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-900">{selectedLog.actorName}</span>
                              <span className="text-[10px] text-gray-500 uppercase font-semibold">{t[selectedLog.actorType as keyof typeof t] || selectedLog.actorType}</span>
                           </div>
                        </div>
                        <div className="space-y-1">
                           <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{t.entity}</span>
                           <div className="flex flex-col">
                              <span className="text-sm font-bold text-[#483383]">{selectedLog.entityType}</span>
                              <span className="text-xs text-gray-500">{selectedLog.entityName || '-'}</span>
                           </div>
                        </div>
                        <div className="space-y-1">
                           <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{t.action}</span>
                           <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-900 capitalize">{selectedLog.actionType.replace('-', ' ')}</span>
                              <span className="text-[10px] text-gray-500 uppercase font-semibold">Operation Code</span>
                           </div>
                        </div>
                     </div>

                     <div className="pt-8 border-t border-gray-50 space-y-4">
                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                           <Globe size={20} className="text-gray-400" />
                           <div className="flex flex-col">
                              <span className="text-[10px] font-semibold text-gray-400 uppercase">{t.ip}</span>
                              <span className="text-xs font-bold text-gray-900" dir="ltr">{selectedLog.ip}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                           <Monitor size={20} className="text-gray-400" />
                           <div className="flex flex-col">
                              <span className="text-[10px] font-semibold text-gray-400 uppercase">{t.device}</span>
                              <span className="text-xs font-bold text-gray-900 leading-tight" dir="ltr">{selectedLog.device}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="p-8 border-t border-gray-100 shrink-0">
                     <button
                        onClick={() => setSelectedLog(null)}
                        className="w-full py-4 bg-gray-100 text-gray-900 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
                     >
                        {t.close}
                     </button>
                  </div>
               </div>
               <div className="flex-1 h-full" onClick={() => setSelectedLog(null)} />
            </div>
         )}

         {/* Animation helpers for CSS */}
         <style>{`
        @keyframes slideRightLtr {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slideRightLtr {
          animation: slideRightLtr 0.3s ease-out forwards;
        }
      `}</style>
      </div>
   );
};

export default ActivityLogModule;
