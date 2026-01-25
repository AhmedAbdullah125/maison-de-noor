import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, Lock } from "lucide-react";

interface SignUpPageProps {
  onLoginSuccess?: () => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.phone || !formData.password || !formData.confirmPassword) {
      setError("يرجى ملء جميع الحقول");
      return;
    }
    if (!/^\+\d{8,15}$/.test(formData.phone)) {
      setError("رقم الهاتف يجب أن يبدأ بـ + ويتكون من 8 إلى 15 رقم");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("كلمة المرور غير متطابقة");
      return;
    }

    navigate("/verify", {
      state: {
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
      },
    });
  };

  const handleGuestLogin = () => {
    onLoginSuccess?.();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex flex-col h-full bg-app-bg relative font-alexandria overflow-hidden min-h-screen">
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-12 pb-10 flex flex-col justify-center">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-app-text mb-2">تسجيل حساب جديد</h1>
          <p className="text-sm text-app-textSec">أنشئي حسابك لتستمتعي بخدماتنا</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="relative">
            <input
              type="text"
              name="name"
              placeholder="الاسم"
              className="w-full p-4 pr-12 rounded-2xl border border-app-card/50 bg-white outline-none focus:border-app-gold text-right text-app-text placeholder:text-app-textSec/50"
              value={formData.name}
              onChange={handleChange}
            />
            <User className="absolute right-4 top-1/2 -translate-y-1/2 text-app-textSec/50" size={20} />
          </div>

          <div className="relative">
            <input
              type="tel"
              name="phone"
              placeholder="رقم الهاتف"
              className="w-full p-4 pr-12 rounded-2xl border border-app-card/50 bg-white outline-none focus:border-app-gold text-right text-app-text placeholder:text-app-textSec/50"
              value={formData.phone}
              onChange={handleChange}
              dir="ltr"
            />
            <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-app-textSec/50" size={20} />
          </div>

          <div className="relative">
            <input
              type="password"
              name="password"
              placeholder="كلمة المرور"
              className="w-full p-4 pr-12 rounded-2xl border border-app-card/50 bg-white outline-none focus:border-app-gold text-right text-app-text placeholder:text-app-textSec/50"
              value={formData.password}
              onChange={handleChange}
              dir="ltr"
            />
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-app-textSec/50" size={20} />
          </div>

          <div className="relative">
            <input
              type="password"
              name="confirmPassword"
              placeholder="تأكيد كلمة المرور"
              className="w-full p-4 pr-12 rounded-2xl border border-app-card/50 bg-white outline-none focus:border-app-gold text-right text-app-text placeholder:text-app-textSec/50"
              value={formData.confirmPassword}
              onChange={handleChange}
              dir="ltr"
            />
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-app-textSec/50" size={20} />
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-xs font-bold text-center mb-6 bg-red-50 py-2 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="w-full bg-app-gold text-white font-bold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform mb-6"
        >
          تسجيل حساب جديد
        </button>

        <button
          onClick={() => navigate("/login")}
          className="w-full text-app-textSec text-sm font-medium underline decoration-app-textSec/30 underline-offset-4 active:opacity-70 mb-4"
        >
          اذا لديكي حسابي سجلي دخولك
        </button>

        <button
          onClick={handleGuestLogin}
          className="w-full border border-app-gold text-app-gold font-bold py-4 rounded-2xl active:bg-app-gold/5 transition-colors"
        >
          الدخول كزائر
        </button>
      </div>
    </div>
  );
};

export default SignUpPage;
