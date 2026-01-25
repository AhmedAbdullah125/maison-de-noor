import React, { useState } from 'react';
import { Plus, Edit, Trash2, X, Search, UserCheck, Briefcase, Phone, Wallet } from 'lucide-react';
import { db } from '../../services/db';
import { Staff } from '../../types';
import { translations, Locale } from '../../services/i18n';

interface StaffModuleProps {
  lang: Locale;
}

const StaffModule: React.FC<StaffModuleProps> = ({ lang }) => {
  const [dbData, setDbData] = useState(db.getData());
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const t = translations[lang];
  
  const [form, setForm] = useState<Partial<Staff>>({
    name: '',
    phone: '',
    title: '',
    salary: 0,
    responsibilities: '',
    vacationBalanceDays: 30,
    isActive: true
  });

  const filtered = dbData.staff.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenModal = (stf?: Staff) => {
    if (stf) {
      setEditingStaff(stf);
      setForm(stf);
    } else {
      setEditingStaff(null);
      setForm({ name: '', phone: '', title: '', salary: 0, responsibilities: '', vacationBalanceDays: 30, isActive: true });
    }
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name) return;

    if (editingStaff) {
      db.updateEntity('staff', editingStaff.id, form);
      // Fix: Provide all required arguments for db.addLog
      db.addLog('Admin', 'admin', 'update', 'Staff', editingStaff.id.toString(), 'Staff Updated', `Edited staff member ${form.name}`);
    } else {
      const newId = `s_${Date.now()}`;
      const newStf: Staff = { 
        id: newId, 
        name: form.name!, 
        phone: form.phone || '', 
        title: form.title || '', 
        salary: Number(form.salary) || 0,
        responsibilities: form.responsibilities || '',
        vacationBalanceDays: Number(form.vacationBalanceDays) || 30,
        notes: '',
        isActive: true
      };
      db.addEntity('staff', newStf);
      // Fix: Provide all required arguments for db.addLog
      db.addLog('Admin', 'admin', 'create', 'Staff', newId, 'Staff Added', `Hired new staff member ${form.name}`);
    }

    setDbData({ ...db.getData() });
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(t.confirmRemove)) {
      db.deleteEntity('staff', id);
      // Fix: Provide all required arguments for db.addLog
      db.addLog('Admin', 'admin', 'delete', 'Staff', id, 'Staff Removed', `Staff member removed: ${id}`);
      setDbData({ ...db.getData() });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            className={`w-full ${lang === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-white border border-gray-200 rounded-2xl outline-none`}
            placeholder={t.name + '...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[#483383] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg"
        >
          <Plus size={20} />
          <span>{t.addEmployee}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((stf) => {
          const stats = {
            completed: dbData.appointments.filter(a => a.staffId === stf.id && a.status === 'completed').length
          };
          return (
            <div key={stf.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-all">
              <div className="flex items-center gap-5 mb-6">
                 <div className="w-14 h-14 bg-[#483383]/10 text-[#483383] rounded-2xl flex items-center justify-center shrink-0">
                   <UserCheck size={28} />
                 </div>
                 <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{stf.name}</h3>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stf.title}</span>
                 </div>
                 <div className="flex gap-1">
                   <button onClick={() => handleOpenModal(stf)} className="p-2 bg-gray-50 text-blue-500 rounded-xl hover:bg-blue-50 transition-all"><Edit size={16} /></button>
                   <button onClick={() => handleDelete(stf.id)} className="p-2 bg-gray-50 text-red-500 rounded-xl hover:bg-red-50 transition-all"><Trash2 size={16} /></button>
                 </div>
              </div>

              <div className="space-y-4 mb-6">
                 <div className="flex items-center gap-3 text-sm text-gray-500">
                    <Phone size={16} className="text-gray-400" />
                    <span dir="ltr">{stf.phone}</span>
                 </div>
                 <div className="flex items-center gap-3 text-sm text-gray-500">
                    <Wallet size={16} className="text-gray-400" />
                    <span>{t.salary}: <span className="font-bold text-gray-900">{stf.salary} {t.currency}</span></span>
                 </div>
                 <div className="flex items-start gap-3 text-sm text-gray-500">
                    <Briefcase size={16} className="text-gray-400 mt-1" />
                    <span>{t.responsibilities}: <span className="text-gray-900 block mt-1 text-xs">{stf.responsibilities}</span></span>
                 </div>
              </div>

              <div className="mt-auto pt-6 border-t border-gray-50 grid grid-cols-2 gap-4">
                 <div className="bg-gray-50 p-4 rounded-2xl text-center">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">{t.bookings}</span>
                    <span className="text-lg font-black text-[#483383]">{stats.completed}</span>
                 </div>
                 <div className="bg-gray-50 p-4 rounded-2xl text-center">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">{t.vacation}</span>
                    <span className="text-lg font-black text-[#483383]">{stf.vacationBalanceDays}d</span>
                 </div>
              </div>
            </div>
          )
        })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingStaff ? t.edit : t.addEmployee}</h3>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t.name}</label>
                  <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t.jobTitle}</label>
                  <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t.phone}</label>
                  <input type="tel" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t.salary} ({t.currency})</label>
                  {/* Fix: Convert string value to number */}
                  <input type="number" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" value={form.salary} onChange={e => setForm({...form, salary: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t.vacation} (Days)</label>
                  {/* Fix: Convert string value to number */}
                  <input type="number" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" value={form.vacationBalanceDays} onChange={e => setForm({...form, vacationBalanceDays: Number(e.target.value)})} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t.responsibilities}</label>
                  <textarea className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none h-24" value={form.responsibilities} onChange={e => setForm({...form, responsibilities: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setModalOpen(false)} className="flex-1 py-4 font-bold text-gray-500 bg-gray-50 rounded-2xl">{t.cancel}</button>
                <button onClick={handleSave} className="flex-1 py-4 font-bold text-white bg-[#483383] rounded-2xl shadow-lg">{t.save}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffModule;