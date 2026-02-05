
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { translations, getLang, Locale } from '../../services/i18n';
import { useAdminLogin } from './auth/useAdminLogin';
import { isLoggedIn } from '../auth/authStorage';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const lang: Locale = getLang();
  const t = translations[lang];
  const { login, isLoading } = useAdminLogin(lang);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await login(credentials);

    if (result.ok) {
      // Navigate to home page on successful login
      navigate('/', { replace: true });
    } else {
      // Display error message
      setError(result.error || (lang === 'ar' ? 'بيانات الدخول غير صحيحة.' : 'Invalid credentials.'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-amiri" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#483383] text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{t.adminLogin}</h1>
          <p className="text-gray-500 mt-2">{t.signInMessage}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.username}</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.password}</label>
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

          {error && <p className="text-red-500 text-sm font-normal text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#483383] text-white font-semibold py-4 rounded-xl shadow-lg hover:bg-[#352C48] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (lang === 'ar' ? 'جاري تسجيل الدخول...' : 'Logging in...') : t.signIn}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
