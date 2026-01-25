import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { registerRequest } from "../services/register";

interface OTPPageProps {
  onLoginSuccess: () => void;
  lang?: string;
}

const OTPPage: React.FC<OTPPageProps> = ({ onLoginSuccess, lang = "ar" }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const state = (location.state || {}) as { name?: string; phone?: string; password?: string };
  const name = state.name || "";
  const phone = state.phone || "";
  const password = state.password || "";

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (!name || !phone || !password) {
      navigate("/signup", { replace: true });
    }
  }, [name, phone, password, navigate]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setError(null);
    if (value && index < 3) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 4) {
      setError("يرجى إدخال الكود كاملاً");
      return;
    }

    // ✅ مؤقت: OTP = 1234
    if (code !== "1234") {
      setError("الكود غير صحيح، يرجى المحاولة مرة أخرى");
      setOtp(["", "", "", ""]);
      inputRefs.current[0]?.focus();
      return;
    }

    // ✅ بعد OTP الصح: Register API
    const res = await registerRequest({ name, phone, password }, setLoading, lang);
    if (!res.ok) {
      setError(res.error || "فشل إنشاء الحساب");
      return;
    }

    onLoginSuccess();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex flex-col h-full bg-app-bg relative font-alexandria overflow-hidden min-h-screen">
      <header className="absolute top-0 left-0 right-0 p-6 flex items-center">
        <button
          onClick={() => navigate("/signup")}
          className="p-2 bg-white rounded-full shadow-sm text-app-text hover:bg-app-card transition-colors"
        >
          <ArrowRight size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-24 pb-10 flex flex-col justify-center">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-app-text mb-2">كود التفعيل</h1>
          <p className="text-sm text-app-textSec">أدخلي كود التفعيل المرسل بالواتساب</p>
          <p className="text-xs text-app-gold mt-2 font-bold" dir="ltr">
            {phone}
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-8" dir="ltr">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-14 h-14 rounded-2xl border-2 border-app-card bg-white text-center text-2xl font-bold text-app-gold outline-none focus:border-app-gold focus:shadow-lg transition-all"
              inputMode="numeric"
              disabled={loading}
            />
          ))}
        </div>

        {error && <div className="text-red-500 text-xs font-bold text-center mb-6">{error}</div>}

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-app-gold text-white font-bold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform disabled:opacity-60 disabled:active:scale-100"
        >
          {loading ? "جاري التفعيل..." : "تأكيد"}
        </button>
      </div>
    </div>
  );
};

export default OTPPage;
