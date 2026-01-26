
import React, { useState } from 'react';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';
import { db } from '../../services/db';
import { Brand } from '../../types';
import { translations, Locale } from '../../services/i18n';

interface CategoriesModuleProps {
  lang: Locale;
}

const CategoriesModule: React.FC<CategoriesModuleProps> = ({ lang }) => {
  const [data, setData] = useState(db.getData().categories);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Brand | null>(null);
  const [form, setForm] = useState({ name: '', nameEn: '', image: '' });
  const t = translations[lang];

  const filtered = data.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenModal = (cat?: Brand) => {
    if (cat) {
      setEditingCategory(cat);
      setForm({ name: cat.name, nameEn: cat.nameEn || '', image: cat.image });
    } else {
      setEditingCategory(null);
      setForm({ name: '', nameEn: '', image: '' });
    }
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name) return;

    const payload = {
      name: form.name,
      nameEn: form.nameEn,
      image: form.image
    };

    if (editingCategory) {
      db.updateEntity('categories', editingCategory.id, payload);
      db.addLog('Admin', 'admin', 'update', 'Category', editingCategory.id.toString(), 'Category Updated', `Admin updated category: ${form.name}`, 'info', form.name);
    } else {
      const newId = Math.max(0, ...data.map(c => c.id)) + 1;
      const newCat: Brand = { id: newId, ...payload, productIds: [] };
      db.addEntity('categories', newCat);
      db.addLog('Admin', 'admin', 'create', 'Category', newId.toString(), 'New Category', `Admin created a new category: ${form.name}`, 'info', form.name);
    }

    setData([...db.getData().categories]);
    setModalOpen(false);
  };

  const handleDelete = (id: number) => {
    const target = data.find(c => c.id === id);
    if (confirm(t.confirmDelete)) {
      db.deleteEntity('categories', id);
      db.addLog('Admin', 'admin', 'delete', 'Category', id.toString(), 'Category Deleted', `Admin removed category: ${target?.name || id}`, 'danger', target?.name);
      setData([...db.getData().categories]);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="relative w-full md:w-96">
          <input
            type="text"
            className={`w-full ${lang === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all`}
            placeholder={t.searchCategories}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#483383] text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-lg shadow-[#483383]/20"
        >
          <Plus size={20} />
          <span>{t.addCategory}</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-start">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.image}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.name}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.services}</th>
              <th className={`px-6 py-4 text-xs font-semibold text-gray-400 uppercase ${lang === 'ar' ? 'text-start' : 'text-end'}`}>{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <img src={cat.image} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                </td>
                <td className="px-6 py-4 font-semibold text-gray-900">
                  <p>{cat.name}</p>
                  {cat.nameEn && <p className="text-xs text-gray-400 font-normal">{cat.nameEn}</p>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{cat.productIds.length} {t.services}</td>
                <td className={`px-6 py-4 ${lang === 'ar' ? 'text-start' : 'text-end'}`}>
                  <div className={`flex items-center gap-2 ${lang === 'ar' ? 'justify-start' : 'justify-end'}`}>
                    <button onClick={() => handleOpenModal(cat)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title={t.edit}><Edit size={18} /></button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title={t.delete}><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editingCategory ? t.edit : t.addCategory}</h3>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.categoryNameAr}</label>
                <input
                  type="text"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#483383]"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: الشعر"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.categoryNameEn}</label>
                <input
                  type="text"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#483383] text-left"
                  dir="ltr"
                  value={form.nameEn}
                  onChange={e => setForm({ ...form, nameEn: e.target.value })}
                  placeholder="e.g. Hair"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.imageUrl}</label>
                <input
                  type="text"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#483383]"
                  value={form.image}
                  onChange={e => setForm({ ...form, image: e.target.value })}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setModalOpen(false)} className="flex-1 py-4 font-semibold text-gray-500 bg-gray-50 rounded-2xl">{t.cancel}</button>
                <button onClick={handleSave} className="flex-1 py-4 font-semibold text-white bg-[#483383] rounded-2xl shadow-lg">{t.save}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesModule;
