import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBookings } from '../../components/admin/bookings/useBookings';
import { BookingStatus } from '../../components/admin/bookings/bookings.api';

const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const lang = 'ar'; // You can get this from context or props if needed
  const perPage = 100; // Fetch more to filter by date locally

  const { isLoading, apiRows } = useBookings(lang, 'upcoming', perPage);

  const [currentDate, setCurrentDate] = useState(new Date());

  // Filter appointments by selected date
  const appointments = useMemo(() => {
    const dateStr = currentDate.toISOString().split('T')[0];
    return apiRows.filter((booking) => booking.start_date === dateStr);
  }, [apiRows, currentDate]);

  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const renderSkeleton = () => (
    <div className="space-y-4 pb-24">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white p-5 rounded-[24px] border border-gray-100 animate-pulse">
          <div className="h-6 bg-gray-100 rounded-lg w-3/4 mb-3" />
          <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-full bg-app-bg pt-6 px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-app-text">المواعيد</h1>
          <p className="text-xs text-gray-400 font-medium mt-1">جدول اليوم</p>
        </div>
        <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-app-gold">
          <Calendar size={20} />
        </div>
      </div>

      {/* Date Navigation */}
      <div className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 flex items-center justify-between mb-6">
        <button onClick={handlePrevDay} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-app-text transition-colors">
          <ChevronRight size={20} />
        </button>
        <span className="text-sm font-bold text-app-text">{formatDateDisplay(currentDate)}</span>
        <button onClick={handleNextDay} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-app-text transition-colors">
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        renderSkeleton()
      ) : (
        <div className="space-y-4 pb-24">
          {appointments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="font-medium">لا توجد مواعيد لهذا اليوم</p>
            </div>
          ) : (
            appointments.map((booking) => {
              const status: BookingStatus = (booking.status as BookingStatus) || 'upcoming';
              const isCompleted = status === 'completed';

              return (
                <div key={booking.id} className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 w-1.5 h-full ${isCompleted ? 'bg-green-500' : 'bg-app-gold'}`} />

                  <div className="flex justify-between items-start mb-4 pr-3">
                    <div>
                      <h3 className="font-bold text-app-text text-lg">{booking.booking_number || `#${booking.id}`}</h3>
                      <p className="text-xs text-gray-400 font-medium mt-1">{booking.service || '—'}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5 text-app-gold bg-app-gold/5 px-2 py-1 rounded-lg">
                        <Clock size={14} />
                        <span className="text-xs font-bold font-mono pt-0.5" dir="ltr">{booking.start_time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pr-3 pt-2 border-t border-gray-50">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isCompleted ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                      {isCompleted ? 'مكتمل' : 'قادم'}
                    </span>

                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
