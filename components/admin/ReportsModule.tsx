
import React, { useState, useMemo } from 'react';
import {
   TrendingUp,
   ShoppingBag,
   Users,
   BarChart3,
   Calendar,
   Download,
   ChevronRight,
   ArrowUpRight,
   ArrowDownRight,
   Filter
} from 'lucide-react';
import { db } from '../../services/db';
import { translations, Locale } from '../../services/i18n';
import { Appointment, Product, Brand, User } from '../../types';

interface ReportsModuleProps {
   lang: Locale;
}

type FilterType = 'current_month' | 'today' | 'custom';

const ReportsModule: React.FC<ReportsModuleProps> = ({ lang }) => {
   const t = translations[lang];
   const dbData = db.getData();

   const [filterType, setFilterType] = useState<FilterType>('current_month');
   const [customRange, setCustomRange] = useState({
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
   });

   const filteredBookings = useMemo(() => {
      let fromDate: Date;
      let toDate: Date = new Date();
      toDate.setHours(23, 59, 59, 999);

      if (filterType === 'current_month') {
         fromDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      } else if (filterType === 'today') {
         fromDate = new Date();
         fromDate.setHours(0, 0, 0, 0);
      } else {
         fromDate = new Date(customRange.from);
         toDate = new Date(customRange.to);
         toDate.setHours(23, 59, 59, 999);
      }

      return dbData.appointments.filter(appt => {
         if (appt.status !== 'completed') return false;
         const apptDate = new Date(appt.dateISO);
         return apptDate >= fromDate && apptDate <= toDate;
      });
   }, [dbData.appointments, filterType, customRange]);

   const stats = useMemo(() => {
      const totalRevenue = filteredBookings.reduce((sum, b) => sum + (b.pricePaidNow || 0), 0);
      const uniqueClients = new Set(filteredBookings.map(b => b.userId)).size;
      const avgOrder = filteredBookings.length > 0 ? totalRevenue / filteredBookings.length : 0;

      return {
         revenue: totalRevenue,
         bookings: filteredBookings.length,
         clients: uniqueClients,
         aov: avgOrder
      };
   }, [filteredBookings]);

   const topServices = useMemo(() => {
      const map: Record<string, { name: string, count: number, revenue: number, category: string }> = {};

      filteredBookings.forEach(b => {
         if (!map[b.serviceId]) {
            // Find category backward mapping
            const cat = dbData.categories.find(c => c.productIds.includes(Number(b.serviceId)));
            map[b.serviceId] = {
               name: b.serviceName,
               count: 0,
               revenue: 0,
               category: cat?.name || '-'
            };
         }
         map[b.serviceId].count += 1;
         map[b.serviceId].revenue += (b.pricePaidNow || 0);
      });

      return Object.values(map)
         .sort((a, b) => b.revenue - a.revenue)
         .slice(0, 10);
   }, [filteredBookings, dbData.categories]);

   const topCategories = useMemo(() => {
      const map: Record<string, { name: string, count: number, revenue: number }> = {};

      filteredBookings.forEach(b => {
         const cat = dbData.categories.find(c => c.productIds.includes(Number(b.serviceId)));
         const catName = cat?.name || 'Other';
         if (!map[catName]) {
            map[catName] = { name: catName, count: 0, revenue: 0 };
         }
         map[catName].count += 1;
         map[catName].revenue += (b.pricePaidNow || 0);
      });

      return Object.values(map).sort((a, b) => b.revenue - a.revenue);
   }, [filteredBookings, dbData.categories]);

   const topClients = useMemo(() => {
      const map: Record<string, { name: string, count: number, spend: number }> = {};

      filteredBookings.forEach(b => {
         if (!b.userId) return;
         if (!map[b.userId]) {
            const user = dbData.users.find(u => u.id === b.userId);
            map[b.userId] = { name: user?.name || b.userId, count: 0, spend: 0 };
         }
         map[b.userId].count += 1;
         map[b.userId].spend += (b.pricePaidNow || 0);
      });

      return Object.values(map).sort((a, b) => b.spend - a.spend).slice(0, 10);
   }, [filteredBookings, dbData.users]);

   // Daily Chart Logic
   const dailyChartData = useMemo(() => {
      const map: Record<string, number> = {};
      filteredBookings.forEach(b => {
         map[b.dateISO] = (map[b.dateISO] || 0) + (b.pricePaidNow || 0);
      });

      const sortedDates = Object.keys(map).sort();
      const maxRev = Math.max(...Object.values(map), 1);

      return sortedDates.map(date => ({
         date,
         revenue: map[date],
         height: (map[date] / maxRev) * 100
      }));
   }, [filteredBookings]);

   const exportToCSV = () => {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += `Report,${t.salesReports}\n`;
      csvContent += `Filter,${filterType}\n\n`;

      csvContent += `KPI,Value\n`;
      csvContent += `${t.totalRevenue},${stats.revenue.toFixed(3)}\n`;
      csvContent += `${t.totalCompletedBookings},${stats.bookings}\n`;
      csvContent += `${t.uniqueClients},${stats.clients}\n`;
      csvContent += `${t.averageOrderValue},${stats.aov.toFixed(3)}\n\n`;

      csvContent += `Top Services,Category,Sales,Revenue\n`;
      topServices.forEach(s => {
         csvContent += `${s.name},${s.category},${s.count},${s.revenue.toFixed(3)}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `salon_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   return (
      <div className="space-y-8 animate-fadeIn pb-20">

         {/* 1. Header & Filters */}
         <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
               <div className="p-3 bg-[#483383]/10 text-[#483383] rounded-2xl">
                  <BarChart3 size={24} />
               </div>
               <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t.salesReports}</h2>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">{filteredBookings.length} {t.completed}</p>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
               <button
                  onClick={() => setFilterType('current_month')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filterType === 'current_month' ? 'bg-[#483383] text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
               >
                  {t.currentMonth}
               </button>
               <button
                  onClick={() => setFilterType('today')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filterType === 'today' ? 'bg-[#483383] text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
               >
                  {t.today}
               </button>
               <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                  <input
                     type="date"
                     className="bg-transparent text-[10px] font-semibold outline-none px-2"
                     value={customRange.from}
                     onChange={e => { setCustomRange({ ...customRange, from: e.target.value }); setFilterType('custom'); }}
                  />
                  <span className="text-gray-300">-</span>
                  <input
                     type="date"
                     className="bg-transparent text-[10px] font-semibold outline-none px-2"
                     value={customRange.to}
                     onChange={e => { setCustomRange({ ...customRange, to: e.target.value }); setFilterType('custom'); }}
                  />
               </div>
               <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-green-100 transition-all ml-2"
               >
                  <Download size={16} />
                  <span>{t.exportCsv}</span>
               </button>
            </div>
         </div>

         {/* 2. KPI Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-violet-50 text-[#483383] rounded-2xl"><TrendingUp size={20} /></div>
                  <span className="flex items-center text-green-500 text-[10px] font-semibold bg-green-50 px-2 py-0.5 rounded-lg">
                     <ArrowUpRight size={10} /> 12%
                  </span>
               </div>
               <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{t.totalRevenue}</p>
               <h3 className="text-xl font-semibold text-gray-900">{stats.revenue.toFixed(3)} <span className="text-xs font-semibold text-gray-400">{t.currency}</span></h3>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl"><ShoppingBag size={20} /></div>
               </div>
               <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{t.totalCompletedBookings}</p>
               <h3 className="text-xl font-semibold text-gray-900">{stats.bookings}</h3>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl"><Users size={20} /></div>
               </div>
               <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{t.uniqueClients}</p>
               <h3 className="text-xl font-semibold text-gray-900">{stats.clients}</h3>
            </div>

            <div className="bg-[#100F19] p-6 rounded-[2rem] shadow-xl text-white">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/10 text-white rounded-2xl"><TrendingUp size={20} /></div>
               </div>
               <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{t.averageOrderValue}</p>
               <h3 className="text-xl font-semibold">{stats.aov.toFixed(3)} <span className="text-xs font-semibold text-gray-500">{t.currency}</span></h3>
            </div>
         </div>

         {/* 3. Visualization & Lists */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Trend Chart - 2 columns span */}
            <div className="lg:col-span-2 space-y-8">
               <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-900 mb-8 flex items-center justify-between">
                     {t.dailyRevenueTrend}
                     <span className="text-[10px] text-gray-400 uppercase font-semibold">{customRange.from} - {customRange.to}</span>
                  </h3>

                  <div className="relative h-64 flex items-end gap-2 px-2 overflow-x-auto no-scrollbar">
                     {dailyChartData.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm font-semibold uppercase italic">No data available</div>
                     ) : (
                        dailyChartData.map((d, i) => (
                           <div key={i} className="flex-1 min-w-[30px] group relative">
                              <div
                                 className="bg-[#483383] rounded-t-lg transition-all duration-700 hover:bg-violet-400"
                                 style={{ height: `${d.height}%` }}
                              />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#100F19] text-white text-[9px] font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                 {d.revenue.toFixed(2)}
                              </div>
                              <div className="text-[8px] text-gray-400 font-semibold mt-2 rotate-45 origin-left whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                 {d.date.slice(5)}
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>

               {/* Top Selling Services Table */}
               <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                     <h3 className="text-base font-semibold text-gray-900">{t.topSellingServices}</h3>
                     <button className="text-xs font-semibold text-[#483383] hover:underline flex items-center gap-1">{t.viewAll} <ChevronRight size={14} /></button>
                  </div>
                  <table className="w-full text-start">
                     <thead className="bg-gray-50/50">
                        <tr>
                           <th className="px-8 py-4 text-[10px] font-semibold text-gray-400 uppercase text-start">{t.service}</th>
                           <th className="px-8 py-4 text-[10px] font-semibold text-gray-400 uppercase text-start">{t.categories}</th>
                           <th className="px-8 py-4 text-[10px] font-semibold text-gray-400 uppercase text-center">{t.salesCount}</th>
                           <th className="px-8 py-4 text-[10px] font-semibold text-gray-400 uppercase text-end">{t.totalRevenue}</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {topServices.map((s, i) => (
                           <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className="px-8 py-4">
                                 <span className="text-xs font-semibold text-gray-900">{s.name}</span>
                              </td>
                              <td className="px-8 py-4">
                                 <span className="text-[10px] font-semibold text-gray-400 uppercase">{s.category}</span>
                              </td>
                              <td className="px-8 py-4 text-center">
                                 <span className="text-xs font-semibold text-gray-700">{s.count}</span>
                              </td>
                              <td className="px-8 py-4 text-end">
                                 <span className="text-xs font-semibold text-[#483383]">{s.revenue.toFixed(3)}</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Sidebar Reports (Categories & Clients) */}
            <div className="space-y-8">
               {/* Most Requested Category */}
               <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-gray-50">
                     <h3 className="text-base font-semibold text-gray-900">{t.mostRequestedCategories}</h3>
                  </div>
                  <div className="p-6 space-y-4">
                     {topCategories.map((c, i) => {
                        const share = (c.revenue / stats.revenue) * 100;
                        return (
                           <div key={i} className="space-y-2">
                              <div className="flex justify-between items-end">
                                 <span className="text-xs font-semibold text-gray-900">{c.name}</span>
                                 <span className="text-[10px] font-semibold text-gray-400">{c.revenue.toFixed(2)} {t.currency}</span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                 <div className="h-full bg-violet-400 rounded-full" style={{ width: `${share}%` }} />
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>

               {/* Most Active Clients */}
               <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-gray-50">
                     <h3 className="text-base font-semibold text-gray-900">{t.mostActiveClients}</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                     {topClients.map((u, i) => (
                        <div key={i} className="px-8 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-default">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-semibold text-[10px]">
                                 {u.name.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-xs font-semibold text-gray-900">{u.name}</span>
                                 <span className="text-[9px] font-semibold text-gray-400 uppercase">{u.count} {t.bookings}</span>
                              </div>
                           </div>
                           <span className="text-xs font-semibold text-green-600">
                              {u.spend.toFixed(2)} <span className="text-[8px] opacity-60">KWD</span>
                           </span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

         </div>

      </div>
   );
};

export default ReportsModule;
