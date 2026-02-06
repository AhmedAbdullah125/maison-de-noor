
import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo credentials
    if (username === 'staff' && password === '1234' || username === 'noor' && password === '123456') {
      localStorage.setItem('salon_team_token', 'demo_token');
      onLogin();
    } else {
      setError('بيانات الدخول غير صحيحة');
    }
  };

  return (
    <div className="w-full max-w-[430px] bg-white min-h-screen flex flex-col items-center justify-center p-8 mx-auto font-alexandria">
      <div className="w-20 h-20 bg-app-gold rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-app-gold/20">
        <Lock className="text-white" size={32} />
      </div>

      <h1 className="text-2xl font-semibold text-app-text mb-2">تسجيل دخول الموظفين</h1>
      <p className="text-sm text-gray-400 mb-8">يرجى ادخال بيانات حسابك</p>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="اسم المستخدم"
            className="w-full p-4 pr-12 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-app-gold focus:bg-white transition-all text-right"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>

        <div className="relative">
          <input
            type="password"
            placeholder="كلمة المرور"
            className="w-full p-4 pr-12 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-app-gold focus:bg-white transition-all text-right"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>

        {error && (
          <div className="text-red-500 text-xs font-semibold text-center bg-red-50 py-2 rounded-xl">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/20 active:scale-[0.98] transition-transform mt-4"
        >
          دخول
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">بيانات تجريبية:</p>
        <p className="text-xs font-semibold text-app-gold mt-1">user: staff / pass: 1234</p>
      </div>
    </div>
  );
};

export default LoginPage;
