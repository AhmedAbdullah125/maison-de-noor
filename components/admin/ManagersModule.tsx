
import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, X, Search, Shield, User, Mail, ShieldAlert, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { db } from '../../services/db';
import { Manager, ManagerPermissions } from '../../types';
import { translations, Locale } from '../../services/i18n';

interface ManagersModuleProps {
  lang: Locale;
}

// Add missing serviceAddons property to DEFAULT_PERMISSIONS to match ManagerPermissions interface.
const DEFAULT_PERMISSIONS: ManagerPermissions = {
  dashboard: true, categories: true, services: true, serviceAddons: true, users: true, upcomingBookings: true,
  completedBookings: true, subscriptions: true, staffHR: false, accounting: false,
  reports: false, notifications: true, activityLog: true, managers: false
};

const ManagersModule: React.FC<ManagersModuleProps> = ({ lang }) => {
  const t = translations[lang];
  const [dbData, setDbData] = useState(db.getData());
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');

  const currentLoggedIn = JSON.parse(localStorage.getItem('salon_admin_session') || '{}') as Manager;

  const [form, setForm] = useState<Partial<Manager>>({
    fullName: '', username: '', email: '', password: '', role: 'admin',
    permissions: { ...DEFAULT_PERMISSIONS }, status: 'active'
  });

  const filtered = useMemo(() => {
    return dbData.managers.filter(m => {
      const matchesSearch = m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [dbData.managers, searchTerm, statusFilter]);

  const handleOpenModal = (mgr?: Manager) => {
    if (mgr) {
      setEditingManager(mgr);
      setForm({ ...mgr, password: '' });
    } else {
      setEditingManager(null);
      setForm({
        fullName: '', username: '', email: '', password: '', role: 'admin',
        permissions: { ...DEFAULT_PERMISSIONS }, status: 'active'
      });
    }
    setModalOpen(true);
  };

  const handleTogglePermission = (key: keyof ManagerPermissions) => {
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions!,
        [key]: !prev.permissions![key]
      }
    }));
  };

  const handleSave = () => {
    if (!form.fullName || !form.username || !form.email) return;

    if (editingManager) {
      const updateData = { ...form, updatedAt: new Date().toISOString() };
      if (!updateData.password) delete updateData.password;

      db.updateEntity('managers', editingManager.id, updateData);
      db.addLog(currentLoggedIn.fullName, 'admin', 'update', 'Manager', editingManager.id, 'Manager Updated', `Admin updated manager profile: ${form.username}`);
    } else {
      const newId = `m_${Date.now()}`;
      const newMgr: Manager = {
        ...form as Manager,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: null
      };
      db.addEntity('managers', newMgr);
      db.addLog(currentLoggedIn.fullName, 'admin', 'create', 'Manager', newId, 'Manager Created', `New dashboard manager added: ${form.username}`);
    }

    setDbData({ ...db.getData() });
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (id === currentLoggedIn.id) {
      alert(t.cannotDeleteSelf);
      return;
    }

    const target = dbData.managers.find(m => m.id === id);
    const superAdmins = dbData.managers.filter(m => m.role === 'super_admin' && m.status === 'active');

    if (target?.role === 'super_admin' && superAdmins.length <= 1) {
      alert(t.lastSuperAdmin);
      return;
    }

    if (confirm(t.confirmDelete)) {
      db.deleteEntity('managers', id);
      db.addLog(currentLoggedIn.fullName, 'admin', 'delete', 'Manager', id, 'Manager Deleted', `Admin removed manager: ${target?.username}`);
      setDbData({ ...db.getData() });
    }
  };

  const handleStatusToggle = (mgr: Manager) => {
    const newStatus = mgr.status === 'active' ? 'disabled' : 'active';
    db.updateEntity('managers', mgr.id, { status: newStatus });
    db.addLog(currentLoggedIn.fullName, 'admin', 'status-change', 'Manager', mgr.id, 'Status Changed', `Set ${mgr.username} to ${newStatus}`);
    setDbData({ ...db.getData() });
  };

  const permissionKeys = Object.keys(DEFAULT_PERMISSIONS) as (keyof ManagerPermissions)[];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              className={`w-full ${lang === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383]`}
              placeholder={t.searchManagers}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <Search className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
          </div>
          <select
            className="bg-white border border-gray-200 px-4 py-3 rounded-2xl text-xs font-semibold outline-none"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
          >
            <option value="all">{t.all}</option>
            <option value="active">{t.active}</option>
            <option value="disabled">{t.disabled}</option>
          </select>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#483383] text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-lg"
        >
          <Plus size={20} />
          <span>{t.addManager}</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-auto">
        <table className="w-full text-start">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.fullName}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.username}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.email}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.status}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.permissions}</th>
              <th className={`px-6 py-4 text-xs font-semibold text-gray-400 uppercase ${lang === 'ar' ? 'text-start' : 'text-end'}`}>{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((mgr) => {
              const permCount = Object.values(mgr.permissions).filter(v => v === true).length;
              const isSuper = mgr.role === 'super_admin';
              return (
                <tr key={mgr.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">{mgr.fullName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{mgr.username}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{mgr.email}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleStatusToggle(mgr)} className="flex items-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border flex items-center gap-1.5 ${mgr.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                        {mgr.status === 'active' ? <Check size={12} /> : <X size={12} />}
                        {mgr.status === 'active' ? t.active : t.disabled}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-semibold ${isSuper ? 'text-[#483383]' : 'text-gray-400'}`}>
                      {isSuper ? t.fullAccess : `${permCount} ${t.modules}`}
                    </span>
                  </td>
                  <td className={`px-6 py-4 ${lang === 'ar' ? 'text-start' : 'text-end'}`}>
                    <div className={`flex items-center gap-2 ${lang === 'ar' ? 'justify-start' : 'justify-end'}`}>
                      <button onClick={() => handleOpenModal(mgr)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title={t.edit}><Edit size={18} /></button>
                      <button onClick={() => handleDelete(mgr.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title={t.delete}><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-semibold">{editingManager ? t.editManager : t.addManager}</h3>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-full"><X size={20} /></button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
              {/* Basic Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t.fullName}</label>
                  <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t.username}</label>
                  <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t.email}</label>
                  <input type="email" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-start" dir="ltr" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t.password}</label>
                  <input type="password" placeholder="••••••••" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-start" dir="ltr" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
              </div>

              {/* Permissions Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={18} className="text-[#483383]" />
                  <h4 className="text-sm font-semibold text-gray-900">{t.permissions}</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {permissionKeys.map(key => (
                    <div key={key} onClick={() => handleTogglePermission(key)} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                      <span className="text-xs font-semibold text-gray-600 capitalize">{t[key as keyof typeof t] || key.replace(/([A-Z])/g, ' $1')}</span>
                      {form.permissions?.[key] ? (
                        <ToggleRight className="text-[#483383]" size={24} />
                      ) : (
                        <ToggleLeft className="text-gray-300" size={24} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-gray-100 flex gap-4 shrink-0">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-4 font-semibold text-gray-500 bg-gray-50 rounded-2xl">{t.cancel}</button>
              <button onClick={handleSave} className="flex-1 py-4 font-semibold text-white bg-[#483383] rounded-2xl shadow-lg">{t.save}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagersModule;
