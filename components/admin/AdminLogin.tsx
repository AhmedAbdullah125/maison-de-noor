
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { db } from '../../services/db';
import { translations, getLang, Locale } from '../../services/i18n';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  // Auto-fill demo credentials by default
  const [credentials, setCredentials] = useState({ username: 'admin', password: '000000' });
  const [error, setError] = useState('');
  const lang: Locale = getLang();
  const t = translations[lang];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const data = db.getData();
    const manager = data.managers.find(m => 
      m.username === credentials.username && 
      m.password === credentials.password
    );

    if (manager) {
      if (manager.status === 'disabled') {
        setError(lang === 'ar' ? 'حسابك معطل حالياً.' : 'Your account is currently disabled.');
        return;
      }
      
      // Update last login
      db.updateEntity('managers', manager.id, { lastLoginAt: new Date().toISOString() });
      
      localStorage.setItem('salon_admin_session', JSON.stringify(manager));
      db.addLog(manager.fullName, 'admin', 'login', 'Manager', manager.id, 'Manager Login', `Logged into dashboard`);
      navigate('/admin');
    } else {
      setError(lang === 'ar' ? 'بيانات الدخول غير صحيحة.' : 'Invalid credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-alexandria" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#483383] text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t.adminLogin}</h1>
          <p className="text-gray-500 mt-2">{t.signInMessage}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.username}</label>
            <div className="relative">
              <input
                type="text"
                className={`w-full ${lang === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#483383] transition-all`}
                value={credentials.username}
                onChange={e => setCredentials({ ...credentials, username: e.target.value })}
              />
              <User className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.password}</label>
            <div className="relative">
              <input
                type="password"
                className={`w-full ${lang === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#483383] transition-all`}
                value={credentials.password}
                onChange={e => setCredentials({ ...credentials, password: e.target.value })}
              />
              <Lock className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-[#483383] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#352C48] transition-all"
          >
            {t.signIn}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
