import React, { useMemo, useState } from 'react';
import { Plus, Edit, Trash2, X, Search, UserCheck, Briefcase, Phone } from 'lucide-react';
import { translations, Locale } from '../../services/i18n';
import { useStaff } from './staff/useStaff';
import { getRoleDetails, updateRole, createRole, getAllPermissions, deleteRole, ApiPermission } from './staff/staff.api';

interface StaffModuleProps {
  lang: Locale;
}

const StaffModule: React.FC<StaffModuleProps> = ({ lang }) => {
  const { isLoading, apiRows, meta, refetch } = useStaff(lang, 200);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [loadingRoleDetails, setLoadingRoleDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);
  const t = translations[lang];

  // Form state
  const [form, setForm] = useState({
    name: '',
  });

  // Permission state
  const [availablePermissions, setAvailablePermissions] = useState<ApiPermission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Filter roles based on search term
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return apiRows;
    return apiRows.filter((role) => {
      const roleName = (role.name || '').toLowerCase();
      return roleName.includes(q);
    });
  }, [apiRows, searchTerm]);

  // Helper function to format phone number or show fallback
  const formatPhone = (phone?: string) => {
    if (phone && phone.trim()) {
      return phone;
    }
    return '+956*******';
  };

  const handleOpenModal = async (role?: any) => {
    if (role) {
      // Edit existing role
      setEditingRoleId(role.id);
      setLoadingRoleDetails(true);
      setModalOpen(true);

      // Fetch role details
      const result = await getRoleDetails(role.id, lang);
      setLoadingRoleDetails(false);

      if (result.ok) {
        setForm({
          name: result.role.name || '',
        });
        setAvailablePermissions(result.permissions);
        setSelectedPermissions(result.rolePermissions);
      } else {
        // If failed, close modal
        setModalOpen(false);
        setEditingRoleId(null);
      }
    } else {
      // Create new role
      setEditingRoleId(null);
      setForm({ name: '' });
      setSelectedPermissions([]);
      setLoadingRoleDetails(true);
      setModalOpen(true);

      // Fetch all available permissions
      const result = await getAllPermissions(lang);
      setLoadingRoleDetails(false);

      if (result.ok) {
        setAvailablePermissions(result.permissions);
      } else {
        // If failed, close modal
        setModalOpen(false);
      }
    }
  };

  const handleSave = async () => {
    if (!form.name) return;

    if (editingRoleId) {
      // Update existing role
      setSaving(true);
      const result = await updateRole(editingRoleId, form.name, selectedPermissions, lang);
      setSaving(false);

      if (result.ok) {
        setModalOpen(false);
        refetch();
      }
    } else {
      // Create new role
      setSaving(true);
      const result = await createRole(form.name, selectedPermissions, lang);
      setSaving(false);

      if (result.ok) {
        setModalOpen(false);
        refetch();
      }
    }
  };

  const togglePermission = (permissionName: string) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionName)) {
        return prev.filter(p => p !== permissionName);
      } else {
        return [...prev, permissionName];
      }
    });
  };

  const handleDelete = (id: number) => {
    setRoleToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (roleToDelete === null) return;

    const result = await deleteRole(roleToDelete, lang);
    if (result.ok) {
      refetch();
    }

    setDeleteConfirmOpen(false);
    setRoleToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setRoleToDelete(null);
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
          className="bg-[#483383] text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-lg"
        >
          <Plus size={20} />
          <span>{t.addEmployee}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
              <div className="h-14 bg-gray-50 rounded-2xl animate-pulse mb-4" />
              <div className="h-32 bg-gray-50 rounded-2xl animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((role) => {
            return (
              <div key={role.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-all">
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-14 h-14 bg-[#483383]/10 text-[#483383] rounded-2xl flex items-center justify-center shrink-0">
                    <UserCheck size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 truncate">{role.name}</h3>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{role.guard_name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenModal(role)} className="p-2 bg-gray-50 text-blue-500 rounded-xl hover:bg-blue-50 transition-all"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(role.id)} className="p-2 bg-gray-50 text-red-500 rounded-xl hover:bg-red-50 transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <Phone size={16} className="text-gray-400" />
                    <span dir="ltr">{formatPhone(role.phone)}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-gray-500">
                    <Briefcase size={16} className="text-gray-400 mt-1" />
                    <span className="text-gray-900 text-xs">
                      {lang === 'ar' ? 'تاريخ الإنشاء' : 'Created'}: {new Date(role.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-50">
                  <div className="bg-gray-50 p-4 rounded-2xl text-center">
                    <span className="block text-[10px] font-semibold text-gray-400 uppercase">
                      {lang === 'ar' ? 'معرف الدور' : 'Role ID'}
                    </span>
                    <span className="text-base font-semibold text-[#483383]">#{role.id}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {editingRoleId ? (lang === 'ar' ? 'تعديل الدور' : 'Edit Role') : (lang === 'ar' ? 'إضافة دور' : 'Add Role')}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-full">
                <X size={20} />
              </button>
            </div>

            {loadingRoleDetails ? (
              <div className="p-8 space-y-4">
                <div className="h-20 bg-gray-50 rounded-2xl animate-pulse" />
                <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
              </div>
            ) : (
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                {/* Role Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {lang === 'ar' ? 'اسم الدور' : 'Role Name'}
                  </label>
                  <input
                    type="text"
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#483383] transition-colors"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder={lang === 'ar' ? 'أدخل اسم الدور' : 'Enter role name'}
                  />
                </div>

                {/* Permissions */}
                {availablePermissions.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {lang === 'ar' ? 'الصلاحيات' : 'Permissions'}
                    </label>
                    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-2xl min-h-[120px]">
                      {availablePermissions.map((permission) => {
                        const isSelected = selectedPermissions.includes(permission.name);
                        return (
                          <button
                            key={permission.id}
                            onClick={() => togglePermission(permission.name)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 ${isSelected
                              ? 'bg-[#483383] text-white shadow-md'
                              : 'bg-white border border-gray-200 text-gray-700 hover:border-[#483383]'
                              }`}
                          >
                            {permission.name}
                            {isSelected && (
                              <span className="ml-2 opacity-75">✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {lang === 'ar'
                        ? `تم اختيار ${selectedPermissions.length} من ${availablePermissions.length} صلاحية`
                        : `${selectedPermissions.length} of ${availablePermissions.length} permissions selected`
                      }
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-4 font-semibold text-gray-500 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                    disabled={saving}
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-4 font-semibold text-white bg-[#483383] rounded-2xl shadow-lg hover:bg-[#3a2866] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={saving || !form.name}
                  >
                    {saving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : t.save}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
            <div className="px-8 py-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
              </h3>
            </div>

            <div className="p-8">
              <p className="text-gray-600 text-center mb-6">
                {t.confirmRemove}
              </p>

              <div className="flex gap-4">
                <button
                  onClick={cancelDelete}
                  className="flex-1 py-4 font-semibold text-gray-500 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-4 font-semibold text-white bg-red-500 rounded-2xl shadow-lg hover:bg-red-600 transition-colors"
                >
                  {lang === 'ar' ? 'حذف' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffModule;