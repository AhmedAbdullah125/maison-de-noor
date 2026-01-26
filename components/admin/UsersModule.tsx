
import React, { useState } from 'react';
import { Search, UserCheck } from 'lucide-react';
import { db } from '../../services/db';
import { translations, Locale } from '../../services/i18n';

interface UsersModuleProps {
  lang: Locale;
}

const UsersModule: React.FC<UsersModuleProps> = ({ lang }) => {
  const [data] = useState(db.getData().users);
  const [searchTerm, setSearchTerm] = useState('');
  const t = translations[lang];

  const filtered = data.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.phone.includes(searchTerm));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            className={`w-full ${lang === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-white border border-gray-200 rounded-2xl outline-none`}
            placeholder={t.customer + '...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-start">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.customer}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.phone}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.registered}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.role}</th>
              <th className={`px-6 py-4 text-xs font-semibold text-gray-400 uppercase ${lang === 'ar' ? 'text-start' : 'text-end'}`}>{t.status}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#483383]">
                      <UserCheck size={16} />
                    </div>
                    <span className="font-semibold text-gray-900">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500" dir="ltr">{user.phone}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-blue-50 text-blue-600 uppercase">
                    {user.role}
                  </span>
                </td>
                <td className={`px-6 py-4 ${lang === 'ar' ? 'text-start' : 'text-end'}`}>
                  <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    {t.active}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersModule;
