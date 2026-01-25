import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, AlertCircle } from 'lucide-react';
import AppHeader from './AppHeader';

interface ProfileData {
  goal: string;
  name: string;
  age: string;
  scalpType: string;
  usedDermaStamp: string;
  dermaStampAllergy?: string;
  source: string;
  hairTexture: string;
  scalpOiliness: string;
  diagnosedByDoctor: string;
  treatmentHistory: string;
  symptoms: string[];
  details: string;
}

const STORAGE_KEY = 'mezo_hair_profile';

const HairProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<ProfileData>>({
    symptoms: []
  });
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, []);

  const validate = () => {
    const newErrors = new Set<string>();
    if (!formData.goal) newErrors.add('goal');
    if (!formData.name) newErrors.add('name');
    if (!formData.age) newErrors.add('age');
    if (!formData.scalpType) newErrors.add('scalpType');
    if (!formData.usedDermaStamp) newErrors.add('usedDermaStamp');
    if (formData.usedDermaStamp === 'نعم' && !formData.dermaStampAllergy) newErrors.add('dermaStampAllergy');
    if (!formData.source) newErrors.add('source');
    if (!formData.hairTexture) newErrors.add('hairTexture');
    if (!formData.scalpOiliness) newErrors.add('scalpOiliness');
    if (!formData.diagnosedByDoctor) newErrors.add('diagnosedByDoctor');
    if (!formData.treatmentHistory) newErrors.add('treatmentHistory');
    if (!formData.symptoms || formData.symptoms.length === 0) newErrors.add('symptoms');
    if (!formData.details) newErrors.add('details');
    
    setErrors(newErrors);
    return newErrors.size === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      setIsSubmitting(false);
      // Navigate back to account with success state
      navigate('/account', { state: { profileSaved: true } });
    }, 800);
  };

  const toggleSymptom = (symptom: string) => {
    const current = formData.symptoms || [];
    const next = current.includes(symptom) 
      ? current.filter(s => s !== symptom) 
      : [...current, symptom];
    setFormData({ ...formData, symptoms: next });
  };

  const RadioGroup = ({ label, field, options, required = true }: { label: string, field: keyof ProfileData, options: string[], required?: boolean }) => (
    <div className="mb-6">
      <label className="block text-sm font-bold text-app-text mb-3">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="space-y-2">
        {options.map(opt => (
          <label key={opt} className={`flex items-center p-4 rounded-2xl border transition-all cursor-pointer ${formData[field] === opt ? 'border-app-gold bg-app-gold/5 shadow-sm' : 'border-app-card/50 bg-white'}`}>
            <input 
              type="radio" 
              className="hidden" 
              name={field} 
              checked={formData[field] === opt} 
              onChange={() => setFormData({ ...formData, [field]: opt })}
            />
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-3 ${formData[field] === opt ? 'border-app-gold' : 'border-app-textSec/30'}`}>
              {formData[field] === opt && <div className="w-2.5 h-2.5 bg-app-gold rounded-full" />}
            </div>
            <span className={`text-xs font-medium ${formData[field] === opt ? 'text-app-gold' : 'text-app-text'}`}>{opt}</span>
          </label>
        ))}
      </div>
      {errors.has(field) && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> هذا الحقل مطلوب</p>}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-app-bg relative font-alexandria overflow-hidden min-h-screen">
      <AppHeader title="ملف العناية بالفروة و الشعر" onBack={() => navigate('/account')} />

      <main className="flex-1 overflow-y-auto no-scrollbar p-6 pt-24 pb-32">
        <div className="bg-white rounded-[2rem] p-6 mb-6 shadow-sm border border-app-card/30">
          <p className="text-[11px] text-app-textSec leading-loose text-center">
            يرجى تعبئة جميع البيانات المطلوبة بدقة لنتمكن من تقديم أفضل استشارة وعناية مخصصة لشعرك.
          </p>
        </div>

        {/* 1. Goal */}
        <RadioGroup 
          label="حددي الهدف المطلوب" 
          field="goal" 
          options={[
            "جودة فوق الممتازة وتختصرين وقت وجهد ونتائج مضمونة بوقت قياسي فوق الممتاز؟",
            "جودة الصالونات حلوة جدا بس اقل مميزات و تكلفة و التزام أطول وبعض نتائج فورية؟"
          ]} 
        />

        {/* 2. Name */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-app-text mb-2">الاسم <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            className="w-full p-4 rounded-2xl border border-app-card/50 bg-white outline-none focus:border-app-gold text-sm"
            value={formData.name || ''}
            onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="ادخلي اسمك بالكامل"
          />
          {errors.has('name') && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> الاسم مطلوب</p>}
        </div>

        {/* 3. Age */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-app-text mb-2">العمر <span className="text-red-500">*</span></label>
          <input 
            type="number" 
            inputMode="numeric"
            className="w-full p-4 rounded-2xl border border-app-card/50 bg-white outline-none focus:border-app-gold text-sm"
            value={formData.age || ''}
            onChange={e => setFormData({...formData, age: e.target.value})}
            placeholder="مثال: 25"
          />
          {errors.has('age') && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> العمر مطلوب</p>}
        </div>

        {/* 4. Scalp Type */}
        <RadioGroup label="نوع الفروة" field="scalpType" options={["عادية", "حساسة", "حساسة جدا"]} />

        {/* 5. Used Derma Stamp */}
        <RadioGroup label="هل استخدمتي ديرما ستامب" field="usedDermaStamp" options={["نعم", "لا"]} />

        {/* 6. Conditional Allergy */}
        {formData.usedDermaStamp === 'نعم' && (
          <RadioGroup label="عندج حساسية من الديرما ستامب" field="dermaStampAllergy" options={["نعم", "لا"]} />
        )}

        {/* 7. Source */}
        <RadioGroup label="من وين سمعتي عني" field="source" options={["انستقرام", "تيك توك", "سناب جات", "صديقة"]} />

        {/* 8. Hair Texture */}
        <RadioGroup label="شعرج ناعم او خشن" field="hairTexture" options={["ناعم", "خشن"]} />

        {/* 9. Scalp Oiliness */}
        <RadioGroup label="الفروة دهنية او عادية" field="scalpOiliness" options={["دهنية", "عادية"]} />

        {/* 10. Doctor Diagnosis */}
        <RadioGroup label="تشخصتي عند دكتور" field="diagnosedByDoctor" options={["نعم", "لا"]} />

        {/* 11. Chemical Treatments */}
        <RadioGroup label="مسوية علاج فرد او سحب لون" field="treatmentHistory" options={["نعم", "لا"]} />

        {/* 12. Symptoms Multi-select */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-app-text mb-3">هل تعانين من؟ <span className="text-red-500">*</span></label>
          <div className="space-y-2">
            {["صلع وراثي", "تكميم", "تساقط هرموني"].map(sym => {
              const isSelected = formData.symptoms?.includes(sym);
              return (
                <label key={sym} className={`flex items-center p-4 rounded-2xl border transition-all cursor-pointer ${isSelected ? 'border-app-gold bg-app-gold/5 shadow-sm' : 'border-app-card/50 bg-white'}`}>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={isSelected} 
                    onChange={() => toggleSymptom(sym)}
                  />
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ml-3 transition-colors ${isSelected ? 'bg-app-gold border-app-gold' : 'border-app-textSec/30'}`}>
                    {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className={`text-xs font-medium ${isSelected ? 'text-app-gold' : 'text-app-text'}`}>{sym}</span>
                </label>
              );
            })}
          </div>
          {errors.has('symptoms') && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> يرجى اختيار واحد على الأقل</p>}
        </div>

        {/* 13. Details Textarea */}
        <div className="mb-10">
          <label className="block text-sm font-bold text-app-text mb-2">شنو تعانين بالضبط ومن متى تعانين من فراغاتج؟ <span className="text-red-500">*</span></label>
          <textarea 
            className="w-full p-4 rounded-2xl border border-app-card/50 bg-white outline-none focus:border-app-gold text-sm h-32 leading-relaxed"
            value={formData.details || ''}
            onChange={e => setFormData({...formData, details: e.target.value})}
            placeholder="يرجى كتابة التفاصيل هنا..."
          />
          {errors.has('details') && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> التفاصيل مطلوبة</p>}
        </div>
      </main>

      <div className="fixed bottom-[90px] left-1/2 -translate-x-1/2 w-full max-w-[430px] p-6 bg-white border-t border-app-card/30 z-40">
        <button 
          onClick={handleSave}
          disabled={isSubmitting}
          className="w-full bg-app-gold text-white font-bold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
             <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : 'حفظ'}
        </button>
      </div>
    </div>
  );
};

export default HairProfilePage;