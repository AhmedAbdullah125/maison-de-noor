import React, { useState } from 'react';
import { Plus, Wallet, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { db } from '../../services/db';
import { AccountingEntry } from '../../types';
import { translations, Locale } from '../../services/i18n';

interface AccountingModuleProps {
  lang: Locale;
}

const AccountingModule: React.FC<AccountingModuleProps> = ({ lang }) => {
  const [dbData, setDbData] = useState(db.getData());
  const [modalOpen, setModalOpen] = useState(false);
  const t = translations[lang];
  const [form, setForm] = useState<Partial<AccountingEntry>>({
    type: 'income',
    amount: 0,
    category: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

  const income = dbData.accounting.filter(a => a.type === 'income').reduce((s, c) => s + c.amount, 0);
  const expense = dbData.accounting.filter(a => a.type === 'expense').reduce((s, c) => s + c.amount, 0);

  const handleSave = () => {
    if (!form.amount) return;
    const newId = `acc_${Date.now()}`;
    db.addEntity('accounting', { ...form, id: newId, amount: Number(form.amount) });
    // Fix: Provide all required arguments for db.addLog
    db.addLog('Admin', 'admin', 'create', 'Accounting', newId, 'Transaction Added', `${form.type}: ${form.amount} ${t.currency}`);
    setDbData({ ...db.getData() });
    setModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-50 text-green-500 rounded-xl"><TrendingUp size={24} /></div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{t.totalIncome}</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">{income.toFixed(3)} {t.currency}</h2>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-50 text-red-500 rounded-xl"><TrendingDown size={24} /></div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{t.totalExpense}</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">{expense.toFixed(3)} {t.currency}</h2>
        </div>
        <div className="bg-[#100F19] p-8 rounded-[2.5rem] shadow-xl text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/10 text-white rounded-xl"><Wallet size={24} /></div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{t.netProfit}</span>
          </div>
          <h2 className="text-xl font-semibold">{(income - expense).toFixed(3)} {t.currency}</h2>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">{t.recentTransactions}</h3>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-[#483383] text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-lg"
        >
          <Plus size={20} />
          <span>{t.addTransaction}</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-auto">
        <table className="w-full text-start">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.type}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.categories}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.amount}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.date}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.note}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {dbData.accounting.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className={`flex items-center gap-2 font-semibold text-xs ${entry.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {entry.type === 'income' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                    {entry.type === 'income' ? t.income : t.expense}
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-gray-900">{entry.category}</td>
                <td className="px-6 py-4 font-semibold text-gray-900">{entry.amount.toFixed(3)} {t.currency}</td>
                <td className="px-6 py-4 text-sm text-gray-400" dir="ltr">{entry.date}</td>
                <td className="px-6 py-4 text-xs text-gray-500">{entry.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-8 space-y-4">
              <h3 className="text-lg font-semibold mb-4">{t.addTransaction}</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.type}</label>
                <div className="flex gap-2">
                  <button onClick={() => setForm({ ...form, type: 'income' })} className={`flex-1 py-3 rounded-xl font-semibold border transition-all ${form.type === 'income' ? 'bg-green-50 border-green-200 text-green-600' : 'border-gray-100 text-gray-400'}`}>{t.income}</button>
                  <button onClick={() => setForm({ ...form, type: 'expense' })} className={`flex-1 py-3 rounded-xl font-semibold border transition-all ${form.type === 'expense' ? 'bg-red-50 border-red-200 text-red-600' : 'border-gray-100 text-gray-400'}`}>{t.expense}</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t.amount}</label>
                  <input type="number" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value as any })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t.date}</label>
                  <input type="date" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.categories}</label>
                <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.note}</label>
                <textarea className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
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

export default AccountingModule;