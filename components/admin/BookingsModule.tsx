import React, { useState } from 'react';
import { Search, CheckCircle2, XCircle } from 'lucide-react';
import { db } from '../../services/db';
import { Appointment } from '../../types';
import { translations, Locale } from '../../services/i18n';

interface BookingsModuleProps {
  type: 'upcoming' | 'completed';
  lang: Locale;
}

const BookingsModule: React.FC<BookingsModuleProps> = ({ type, lang }) => {
  const [dbData, setDbData] = useState(db.getData());
  const [searchTerm, setSearchTerm] = useState('');
  const t = translations[lang];

  const filtered = dbData.appointments.filter(a =>
    a.status === type &&
    (a.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) || a.userId?.includes(searchTerm))
  );

  const handleStatusChange = (id: string, newStatus: Appointment['status']) => {
    db.updateEntity('appointments', id, { status: newStatus });
    if (newStatus === 'completed') {
      const appt = dbData.appointments.find(a => a.id === id);
      if (appt && appt.pricePaidNow) {
        db.addEntity('accounting', {
          id: `inc_${Date.now()}`,
          type: 'income',
          amount: appt.pricePaidNow,
          date: new Date().toISOString(),
          category: 'Service Booking',
          note: `Completed: ${appt.serviceName}`,
          linkedBookingId: id
        });
      }
    }
    // Fix: Provide all required arguments for db.addLog
    db.addLog('Admin', 'admin', 'update', 'Booking', id, 'Status Updated', `Set to ${newStatus}`);
    setDbData({ ...db.getData() });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            className={`w-full ${lang === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-white border border-gray-200 rounded-2xl outline-none`}
            placeholder={t.service + '...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-auto">
        <table className="w-full text-start">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.bookingId}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.service}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.schedule}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.staffAssigned}</th>
              <th className={`px-6 py-4 text-xs font-semibold text-gray-400 uppercase ${lang === 'ar' ? 'text-start' : 'text-end'}`}>{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((appt) => {
              const assignedStaff = dbData.staff.find(s => s.id === appt.staffId);
              return (
                <tr key={appt.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-semibold text-gray-400 text-xs">#{appt.id.slice(-6)}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{appt.serviceName}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900" dir="ltr">{appt.dateISO}</span>
                      <span className="text-[10px] text-gray-500 font-normal">{appt.time24}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {assignedStaff ? (
                      <span className="text-xs font-semibold text-gray-900">{assignedStaff.name}</span>
                    ) : (
                      <select
                        className="bg-gray-50 border border-gray-100 text-[10px] font-semibold rounded-lg p-1 outline-none"
                        onChange={(e) => {
                          db.updateEntity('appointments', appt.id, { staffId: e.target.value });
                          setDbData({ ...db.getData() });
                        }}
                      >
                        <option value="">{t.unassigned}</option>
                        {dbData.staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    )}
                  </td>
                  <td className={`px-6 py-4 ${lang === 'ar' ? 'text-start' : 'text-end'}`}>
                    {appt.status === 'upcoming' ? (
                      <div className={`flex items-center gap-2 ${lang === 'ar' ? 'justify-start' : 'justify-end'}`}>
                        <button
                          onClick={() => handleStatusChange(appt.id, 'completed')}
                          className="p-2 text-green-500 hover:bg-green-50 rounded-lg"
                          title={t.markCompleted}
                        >
                          <CheckCircle2 size={18} />
                        </button>
                        <button
                          onClick={() => handleStatusChange(appt.id, 'canceled')}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          title={t.cancelBooking}
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    ) : (
                      <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${appt.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {appt.status === 'completed' ? t.completed : t.canceled}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingsModule;