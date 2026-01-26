
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X, Scissors, LayoutGrid, Check, Ticket, Plus, Trash, Trash2, Copy, AlertTriangle, ChevronDown, Upload, Star, Image as ImageIcon } from 'lucide-react';
import { db } from '../../services/db';
import { Product, GlobalAddon, ServiceSubscription } from '../../types';
import { translations, Locale } from '../../services/i18n';

interface ServiceFormPageProps {
  lang: Locale;
}

const ServiceFormPage: React.FC<ServiceFormPageProps> = ({ lang }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const t = translations[lang];
  const isEdit = !!id;

  const [form, setForm] = useState<Partial<Product>>({
    name: '',
    nameEn: '',
    description: '',
    price: '',
    image: '',
    images: [],
    duration: '60 mins',
    globalAddonIds: [],
    subscriptions: []
  });

  const [initialForm, setInitialForm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [globalAddons, setGlobalAddons] = useState<GlobalAddon[]>([]);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [isAddonsExpanded, setIsAddonsExpanded] = useState(false);

  useEffect(() => {
    const dbData = db.getData();
    setGlobalAddons(dbData.serviceAddons || []);

    if (isEdit) {
      const service = dbData.services.find(s => s.id.toString() === id);
      if (service) {
        const data = {
          ...service,
          nameEn: service.nameEn || '',
          images: service.images || [],
          globalAddonIds: service.globalAddonIds || [],
          subscriptions: service.subscriptions || []
        };
        setForm(data);
        setInitialForm(JSON.stringify(data));
      } else {
        setNotFound(true);
      }
    } else {
      const empty = {
        name: '',
        nameEn: '',
        description: '',
        price: '',
        image: '',
        images: [],
        duration: '60 mins',
        globalAddonIds: [],
        subscriptions: []
      };
      setForm(empty);
      setInitialForm(JSON.stringify(empty));
    }
    setIsLoading(false);
  }, [id, isEdit]);

  const hasUnsavedChanges = () => {
    return JSON.stringify(form) !== initialForm;
  };

  const handleCancel = () => {
    if (hasUnsavedChanges()) {
      setShowExitPrompt(true);
    } else {
      navigate('/admin/services');
    }
  };

  const confirmExit = () => {
    navigate('/admin/services');
  };

  const handleToggleGlobalAddon = (addonId: string) => {
    const current = form.globalAddonIds || [];
    const next = current.includes(addonId)
      ? current.filter(id => id !== addonId)
      : [...current, addonId];
    setForm({ ...form, globalAddonIds: next });
  };

  // --- Image Handling ---
  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setForm(prev => ({
            ...prev,
            images: [...(prev.images || []), reader.result as string]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveMainImage = () => {
    setForm(prev => ({ ...prev, image: '' }));
  };

  const handleRemoveGalleryImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index)
    }));
  };

  const handleSetAsMain = (index: number) => {
    const newMain = form.images![index];
    const oldMain = form.image;

    const newGallery = [...(form.images || [])];
    newGallery.splice(index, 1);

    if (oldMain) {
      newGallery.unshift(oldMain);
    }

    setForm(prev => ({
      ...prev,
      image: newMain,
      images: newGallery
    }));
  };

  // --- Subscriptions Logic ---
  const handleAddSubscription = () => {
    const newSub: ServiceSubscription = {
      id: `sub_${Date.now()}`,
      title: '',
      sessionsCount: 2,
      pricePercent: 100,
      validityDays: 30
    };
    setForm(prev => ({ ...prev, subscriptions: [...(prev.subscriptions || []), newSub] }));
  };

  const handleRemoveSubscription = (subId: string) => {
    setForm(prev => ({
      ...prev,
      subscriptions: prev.subscriptions?.filter(s => s.id !== subId)
    }));
  };

  const handleSubscriptionChange = (subId: string, field: keyof ServiceSubscription, value: any) => {
    setForm(prev => ({
      ...prev,
      subscriptions: prev.subscriptions?.map(s =>
        s.id === subId ? { ...s, [field]: value } : s
      )
    }));
  };

  const handleDuplicateSubscription = (sub: ServiceSubscription) => {
    const newSub: ServiceSubscription = {
      ...sub,
      id: `sub_copy_${Date.now()}`,
      title: `${sub.title} (${t.copy})`
    };
    setForm(prev => ({ ...prev, subscriptions: [...(prev.subscriptions || []), newSub] }));
  };

  const calculatePreviewPrice = (sessions: number, percent: number) => {
    if (!form.price) return 0;
    const basePrice = parseFloat(form.price.replace(/[^\d.]/g, '')) || 0;
    const baseTotal = basePrice * sessions;
    return baseTotal * (percent / 100);
  };
  // -------------------------

  const handleSave = () => {
    if (!form.name) {
      alert(lang === 'ar' ? 'يرجى إدخال اسم الخدمة' : 'Please enter the service name.');
      return;
    }

    if (!form.image) {
      alert(lang === 'ar' ? 'يرجى إضافة الصورة الرئيسية' : 'Please add a main image.');
      return;
    }

    // Validate Subscriptions
    if (form.subscriptions) {
      for (const sub of form.subscriptions) {
        if (!sub.title || sub.title.trim().length < 2) {
          alert(lang === 'ar'
            ? 'يرجى إدخال عنوان صحيح لجميع الاشتراكات'
            : 'Please enter a valid title for all subscriptions.');
          return;
        }
        if (sub.sessionsCount < 2) {
          alert(lang === 'ar'
            ? `عدد الجلسات يجب أن يكون 2 على الأقل للاشتراك: ${sub.title}`
            : `Sessions count must be at least 2 for subscription: ${sub.title}`);
          return;
        }
        if (sub.validityDays < 1) {
          alert(lang === 'ar'
            ? `مدة الصلاحية يجب أن تكون يوم واحد على الأقل للاشتراك: ${sub.title}`
            : `Validity days must be at least 1 for subscription: ${sub.title}`);
          return;
        }
      }
    }

    if (isEdit) {
      db.updateEntity('services', Number(id), form);
      db.addLog('Admin', 'admin', 'update', 'Service', id!, 'Service Updated', `Admin updated service details for ${form.name}`, 'info', form.name);
    } else {
      const dbData = db.getData();
      const newId = Math.max(0, ...dbData.services.map(s => s.id)) + 1;
      const newSvc: Product = {
        id: newId,
        name: form.name!,
        nameEn: form.nameEn || '',
        description: form.description || '',
        price: form.price || `0.000 ${t.currency}`,
        image: form.image || '',
        images: form.images || [],
        duration: form.duration || '60 mins',
        globalAddonIds: form.globalAddonIds || [],
        subscriptions: form.subscriptions || [],
        productIds: []
      } as any;
      db.addEntity('services', newSvc);
      db.addLog('Admin', 'admin', 'create', 'Service', newId.toString(), 'New Service Added', `Admin added a new salon service: ${form.name}`, 'info', form.name);
    }

    navigate('/admin/services');
  };

  if (isLoading) return null;

  if (notFound) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <p className="text-gray-500 font-semibold">Service not found</p>
        <button
          onClick={() => navigate('/admin/services')}
          className="bg-[#483383] text-white px-6 py-2 rounded-xl font-semibold"
        >
          Back to Services
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-20 relative">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-[#483383] hover:shadow-sm transition-all"
          >
            <ArrowLeft size={20} className={lang === 'ar' ? 'rotate-180' : ''} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isEdit ? t.edit : t.addService}
            </h2>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">
              {isEdit ? `${t.service} ID: ${id}` : 'Create new service offering'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-white border border-gray-100 rounded-2xl font-semibold text-gray-400 hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <X size={18} />
            <span>{t.cancel}</span>
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-[#483383] text-white rounded-2xl font-semibold shadow-lg shadow-[#483383]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <Save size={18} />
            <span>{t.save}</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Info Section */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-base font-semibold text-gray-900 border-b border-gray-50 pb-4 flex items-center gap-2">
              <Scissors size={18} className="text-[#483383]" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.serviceNameAr}</label>
                <input
                  type="text"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="اسم الخدمة بالعربية"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.serviceNameEn}</label>
                <input
                  type="text"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all text-left"
                  dir="ltr"
                  value={form.nameEn}
                  onChange={e => setForm({ ...form, nameEn: e.target.value })}
                  placeholder="Service Name (English)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.price} ({t.currency})</label>
                <input
                  type="text"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.duration}</label>
                <input
                  type="text"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all"
                  value={form.duration}
                  onChange={e => setForm({ ...form, duration: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.description}</label>
                <textarea
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all h-32 resize-none"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Global Add-ons Selection Section (Collapsible) */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden transition-all">
            <div
              className="p-8 flex items-center justify-between cursor-pointer hover:bg-gray-50/30 transition-colors"
              onClick={() => setIsAddonsExpanded(!isAddonsExpanded)}
            >
              <div className="flex items-center gap-3">
                <LayoutGrid size={20} className="text-[#483383]" />
                <h3 className="text-base font-semibold text-gray-900">{t.serviceAddons}</h3>
                <span className="text-[10px] font-bold text-white bg-[#483383] px-2 py-0.5 rounded-lg ml-2">
                  {form.globalAddonIds?.length} Selected
                </span>
              </div>
              <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${isAddonsExpanded ? 'rotate-180' : ''}`} />
            </div>

            {isAddonsExpanded && (
              <div className="px-8 pb-8 pt-0 animate-fadeIn">
                <div className="h-px w-full bg-gray-50 mb-6" />

                {globalAddons.length === 0 ? (
                  <div className="py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-sm text-gray-400 font-semibold">No global add-ons defined yet.</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate('/admin/service-addons'); }}
                      className="text-xs font-bold text-[#483383] underline mt-2"
                    >
                      Go to Catalog
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {globalAddons.map(addon => {
                      const isSelected = form.globalAddonIds?.includes(addon.id);
                      return (
                        <div
                          key={addon.id}
                          onClick={() => handleToggleGlobalAddon(addon.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${isSelected ? 'border-[#483383] bg-violet-50' : 'border-gray-100 bg-white hover:border-gray-300'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${isSelected ? 'bg-[#483383] border-[#483383] text-white' : 'bg-gray-50 border-gray-200 text-transparent'}`}>
                              <Check size={14} strokeWidth={4} />
                            </div>
                            <div>
                              <p className={`text-sm font-bold ${isSelected ? 'text-[#483383]' : 'text-gray-900'}`}>{lang === 'ar' ? addon.titleAr : addon.titleEn}</p>
                              <p className="text-[10px] text-gray-400 font-semibold uppercase">{addon.items.length} Options</p>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${addon.required ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                            {addon.required ? t.required : t.optional}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Service Subscriptions Section */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Ticket size={18} className="text-[#483383]" />
                  {t.serviceSubscriptions}
                </h3>
                <p className="text-[10px] text-gray-400 mt-1 font-semibold">{t.subscriptionsHelper}</p>
              </div>
              <button
                onClick={handleAddSubscription}
                className="bg-[#483383]/10 text-[#483383] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#483383] hover:text-white transition-all"
              >
                <Plus size={16} />
                <span>{t.addSubscription}</span>
              </button>
            </div>

            <div className="space-y-4">
              {form.subscriptions?.length === 0 && (
                <div className="py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-400 font-semibold">{t.noContentYet}</p>
                </div>
              )}
              {form.subscriptions?.map((sub, idx) => (
                <div key={sub.id} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 relative group transition-all hover:border-gray-200 hover:shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">{t.subscriptionTitle}</label>
                      <input
                        type="text"
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-[#483383]"
                        value={sub.title}
                        onChange={(e) => handleSubscriptionChange(sub.id, 'title', e.target.value)}
                        placeholder={lang === 'ar' ? 'مثال: باقة التوفير' : 'e.g. Saver Package'}
                      />
                    </div>
                    <div className="flex gap-2 mr-4 ml-4">
                      <button onClick={() => handleDuplicateSubscription(sub)} className="p-2 text-gray-400 hover:text-blue-500 bg-white rounded-xl shadow-sm hover:shadow-md transition-all" title={t.duplicate}>
                        <Copy size={16} />
                      </button>
                      <button onClick={() => handleRemoveSubscription(sub.id)} className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-xl shadow-sm hover:shadow-md transition-all" title={t.delete}>
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">{t.sessionsCount}</label>
                      <input
                        type="number"
                        min="2"
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-[#483383]"
                        value={sub.sessionsCount}
                        onChange={(e) => handleSubscriptionChange(sub.id, 'sessionsCount', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">{t.pricePercent}</label>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-[#483383]"
                        value={sub.pricePercent}
                        onChange={(e) => handleSubscriptionChange(sub.id, 'pricePercent', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">{t.validityDays}</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-[#483383]"
                        value={sub.validityDays}
                        onChange={(e) => handleSubscriptionChange(sub.id, 'validityDays', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
                    <p className="text-[10px] font-semibold text-gray-500">
                      {t.estimatedTotal}: <span className="text-[#483383] text-sm">{calculatePreviewPrice(sub.sessionsCount, sub.pricePercent).toFixed(3)} {t.currency}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-base font-semibold text-gray-900 border-b border-gray-50 pb-4">Service Media</h3>

            {/* Main Image */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Main Image (Required)</label>
              {form.image ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden group border border-gray-200">
                  <img src={form.image} className="w-full h-full object-cover" alt="Main" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="cursor-pointer px-4 py-2 bg-white rounded-xl text-xs font-semibold hover:bg-gray-100">
                      Change
                      <input type="file" className="hidden" accept="image/*" onChange={handleMainImageUpload} />
                    </label>
                    <button onClick={handleRemoveMainImage} className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600">Remove</button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-[#483383] hover:bg-violet-50 transition-all bg-gray-50">
                  <Upload size={32} className="text-gray-300" />
                  <span className="text-sm font-semibold text-gray-400 mt-2">Upload Main Image</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleMainImageUpload} />
                </label>
              )}
            </div>

            {/* Gallery Images */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-semibold text-gray-700">Gallery Images</label>
                <label className="cursor-pointer text-[#483383] text-xs font-semibold hover:underline flex items-center gap-1">
                  <Plus size={14} /> Add Images
                  <input type="file" multiple className="hidden" accept="image/*" onChange={handleGalleryUpload} />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {form.images?.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100 bg-gray-50">
                    <img src={img} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleSetAsMain(idx)} className="p-1.5 bg-white/90 rounded-lg text-yellow-500 hover:bg-white shadow-sm" title="Set as Main">
                        <Star size={12} fill="currentColor" />
                      </button>
                      <button onClick={() => handleRemoveGalleryImage(idx)} className="p-1.5 bg-white/90 rounded-lg text-red-500 hover:bg-white shadow-sm" title="Remove">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {(form.images?.length === 0) && (
                  <div className="col-span-3 py-8 text-center border border-dashed border-gray-200 rounded-2xl">
                    <ImageIcon size={24} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-xs font-semibold text-gray-400">No gallery images</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showExitPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-scaleIn text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              {lang === 'ar' ? 'تنبيه: تغييرات غير محفوظة' : 'Unsaved Changes'}
            </h2>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              {lang === 'ar'
                ? 'لديك تعديلات غير محفوظة. هل تريد الخروج بدون حفظ؟'
                : 'You have unsaved changes. Are you sure you want to leave without saving?'}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmExit}
                className="w-full py-4 bg-red-50 text-red-600 font-semibold rounded-2xl active:scale-95 transition-transform"
              >
                {lang === 'ar' ? 'نعم، خروج بدون حفظ' : 'Yes, Leave without Saving'}
              </button>
              <button
                onClick={() => setShowExitPrompt(false)}
                className="w-full py-4 bg-gray-50 text-gray-700 font-semibold rounded-2xl active:scale-95 transition-transform"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceFormPage;
