
import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, User, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { teamData, TeamAppointment } from '../data/demoData';

const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<TeamAppointment[]>([]);

  useEffect(() => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const data = teamData.getAppointmentsByDate(dateStr);
    setAppointments(data);
  }, [currentDate]);

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
      <div className="space-y-4 pb-24">
        {appointments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="font-medium">لا توجد مواعيد لهذا اليوم</p>
          </div>
        ) : (
          appointments.map((apt) => (
            <div key={apt.id} className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-1.5 h-full ${apt.status === 'completed' ? 'bg-green-500' : 'bg-app-gold'}`} />
              
              <div className="flex justify-between items-start mb-4 pr-3">
                <div>
                  <h3 className="font-bold text-app-text text-lg">{apt.clientName}</h3>
                  <p className="text-xs text-gray-400 font-medium mt-1">{apt.serviceName}</p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5 text-app-gold bg-app-gold/5 px-2 py-1 rounded-lg">
                    <Clock size={14} />
                    <span className="text-xs font-bold font-mono pt-0.5">{apt.time}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pr-3 pt-2 border-t border-gray-50">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                  apt.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                }`}>
                  {apt.status === 'completed' ? 'مكتمل' : 'قادم'}
                </span>
                
                <button 
                  onClick={() => navigate(`/team/client/${apt.clientId}`)}
                  className="flex items-center gap-1 text-xs font-bold text-app-text hover:text-app-gold transition-colors"
                >
                  <span>فتح الملف</span>
                  <ChevronLeft size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;
