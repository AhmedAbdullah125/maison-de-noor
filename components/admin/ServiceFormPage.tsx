import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { db } from "../../services/db";
import { Product, ServiceSubscription } from "../../types";
import { translations, Locale } from "../../services/i18n";

import { useCategoriesOptions } from "./categories/useCategoriesOptions";
import { useOptionsOptions } from "./services/useOptionsOptions";

import { toast } from "sonner";
import { http } from "../services/http";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";

import PageHeader from "./ServiceFormPage/components/PageHeader";
import BasicInfoCard from "./ServiceFormPage/components/BasicInfoCard";
import AddonsCard from "./ServiceFormPage/components/AddonsCard";
import SubscriptionsCard from "./ServiceFormPage/components/SubscriptionsCard";
import MediaCard from "./ServiceFormPage/components/MediaCard";
import ExitPrompt from "./ServiceFormPage/components/ExitPrompt";

import { GalleryItem } from "./ServiceFormPage/types";
import { normalizeIds, parsePrice } from "./ServiceFormPage/utils";


interface ServiceFormPageProps {
  lang: Locale;
}

const ServiceFormPage: React.FC<ServiceFormPageProps> = ({ lang }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const t = translations[lang];
  const isEdit = !!id;

  const [form, setForm] = useState<Partial<Product>>({
    name: "",
    nameEn: "",
    description: "",
    price: "",
    image: "",
    images: [],
    duration: "60 mins",
    globalAddonIds: [],
    subscriptions: [],
    category_id: undefined as any,
  });

  const [initialForm, setInitialForm] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [isAddonsExpanded, setIsAddonsExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>("");
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  const { isLoading: catsLoading, rows: categories } = useCategoriesOptions(lang);
  const { isLoading: optionsLoading, rows: options } = useOptionsOptions(lang);

  const selectedOptionIds = useMemo(
    () => normalizeIds(form.globalAddonIds as any),
    [form.globalAddonIds]
  );

  const hasUnsavedChanges = () => JSON.stringify(form) !== initialForm;

  const handleCancel = () => {
    if (hasUnsavedChanges()) setShowExitPrompt(true);
    else {
      navigate("/admin/services");
    }
  };

  const confirmExit = () => {
    navigate("/admin/services");
  };

  const handleToggleGlobalAddon = (optionId: number) => {
    const current = normalizeIds(form.globalAddonIds as any);
    const next = current.includes(optionId)
      ? current.filter((x) => x !== optionId)
      : [...current, optionId];
    setForm((p) => ({ ...p, globalAddonIds: next as any }));
  };

  // ----------------- Image Handling -----------------
  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setMainImageFile(file);
    setMainImagePreview(preview);
    setForm((prev) => ({ ...prev, image: preview }));
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const items: GalleryItem[] = Array.from(files).map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      remote: false,
    }));

    setGallery((prev) => [...prev, ...items]);

    // لو بتحب تفضل محافظ على form.images للـ UI:
    setForm((prev) => ({
      ...prev,
      images: [...(prev.images || []), ...items.map((x) => x.preview)],
    }));
  };

  const handleRemoveMainImage = () => {
    setMainImageFile(null);
    setMainImagePreview("");
    setForm((prev) => ({ ...prev, image: "" }));
  };
  const handleRemoveGalleryImage = (index: number) => {
    setGallery((prev) => {
      const item = prev[index];
      if (item && !item.remote && item.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter((_, i) => i !== index);
    });

    setForm((prev) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index),
    }));
  };

  const handleSetAsMain = (index: number) => {
    const item = gallery[index];
    if (!item) return;

    setGallery((prev) => {
      const next = [...prev];
      next.splice(index, 1);

      // رجّع الـ main القديم للـ gallery (لو موجود)
      if (mainImagePreview) {
        if (mainImageFile) {
          next.unshift({ preview: mainImagePreview, file: mainImageFile, remote: false });
        } else {
          // كان remote main
          next.unshift({ preview: mainImagePreview, file: null, remote: true });
        }
      }

      return next;
    });

    // main الجديد
    setMainImagePreview(item.preview);
    setMainImageFile(item.file ?? null); // لو remote يبقى null
    setForm((prev) => ({ ...prev, image: item.preview }));
  };



  useEffect(() => {
    return () => {
      gallery.forEach((g) => g.preview && URL.revokeObjectURL(g.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------- API: GET service by id -----------------
  async function fetchServiceById(serviceId: string) {
    const res = await http.get(`${DASHBOARD_API_BASE_URL}/services/${serviceId}`, {
      headers: { lang },
    });
    const ok = !!res?.data?.status;
    if (!ok) throw new Error(res?.data?.message || "Failed to load service");

    const item = res.data.data;
    return item;
  }


  // ----------------- Load (Create / Edit) -----------------
  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setIsLoading(true);
        setNotFound(false);

        if (isEdit && id) {
          // Fetch from API
          const item = await fetchServiceById(id);

          if (!item) {
            if (mounted) setNotFound(true);
            return;
          }

          // Extract translations
          const arTranslation = item.translations?.find((t: any) => t.language === "ar");
          const enTranslation = item.translations?.find((t: any) => t.language === "en");

          // Map images
          const apiGalleryUrls: string[] = (item.images || [])
            .map((x: any) => {
              if (typeof x === "string") return x;
              // Handle both 'image' and 'url' properties, and add base URL if needed
              const imgPath = x?.image || x?.url;
              if (!imgPath) return null;
              // If path doesn't start with http, prepend base URL
              if (imgPath.startsWith('http')) return imgPath;
              return `https://maison-de-noor.com/${imgPath}`;
            })
            .filter(Boolean);

          const remoteGallery: GalleryItem[] = apiGalleryUrls.map((url: string, i: number) => ({
            preview: url,
            remote: true,
            id: `remote_${i}`,
            file: null,
          }));

          // Map subscriptions from API format to form format
          const mappedSubscriptions = (item.subscriptions || []).map((sub: any) => {
            const arSubTranslation = sub.translations?.find((t: any) => t.language === "ar");
            return {
              id: sub.id,
              title: arSubTranslation?.name || "",
              sessionsCount: sub.session_count || 2,
              pricePercent: parseFloat(sub.price_percentage || "100"),
              validityDays: sub.validity_days || 30,
            };
          });

          // Handle main image URL
          let mainImageUrl = item.main_image || "";
          if (mainImageUrl && !mainImageUrl.startsWith('http')) {
            mainImageUrl = `https://maison-de-noor.com/${mainImageUrl}`;
          }

          const data: Partial<Product> = {
            name: arTranslation?.name || "",
            nameEn: enTranslation?.name || "",
            description: arTranslation?.description || "",
            price: String(item.price || ""),
            image: mainImageUrl,
            images: apiGalleryUrls,
            duration: "60 mins",
            globalAddonIds: item.option_ids || [],
            subscriptions: mappedSubscriptions,
          };

          (data as any).category_id = item.category_id;
          if (!mounted) return;

          setForm(data);
          setInitialForm(JSON.stringify(data));

          setMainImagePreview(mainImageUrl);
          setMainImageFile(null);
          setGallery(remoteGallery);
        } else {
          const empty: Partial<Product> = {
            name: "",
            nameEn: "",
            description: "",
            price: "",
            image: "",
            images: [],
            duration: "60 mins",
            globalAddonIds: [],
            subscriptions: [],
          };

          (empty as any).category_id = undefined;

          if (!mounted) return;

          setForm(empty);
          setInitialForm(JSON.stringify(empty));
          setMainImageFile(null);
          setMainImagePreview("");
          setGallery([]);
        }
      } catch (e) {
        console.error(e);
        if (mounted) setNotFound(true);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [id, isEdit, lang]);

  // ----------------- Subscriptions handlers -----------------
  const handleAddSubscription = () => {
    const newSub: ServiceSubscription = {
      id: `sub_${Date.now()}`,
      title: "",
      sessionsCount: 2,
      pricePercent: 100,
      validityDays: 30,
    };
    setForm((prev) => ({
      ...prev,
      subscriptions: [...(prev.subscriptions || []), newSub],
    }));
  };

  const handleRemoveSubscription = (subId: string) => {
    setForm((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions?.filter((s: any) => s.id !== subId),
    }));
  };

  const handleSubscriptionChange = (
    subId: string,
    field: keyof ServiceSubscription,
    value: any
  ) => {
    setForm((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions?.map((s: any) =>
        s.id === subId ? { ...s, [field]: value } : s
      ),
    }));
  };

  const handleDuplicateSubscription = (sub: ServiceSubscription) => {
    const newSub: ServiceSubscription = {
      ...sub,
      id: `sub_copy_${Date.now()}`,
      title: `${sub.title} (${t.copy})`,
    };
    setForm((prev) => ({
      ...prev,
      subscriptions: [...(prev.subscriptions || []), newSub],
    }));
  };

  const calculatePreviewPrice = (sessions: number, percent: number) => {
    const basePrice = parsePrice(form.price);
    const baseTotal = basePrice * sessions;
    return baseTotal * (percent / 100);
  };

  // ----------------- Create Service API (FormData) -----------------
  async function createService() {
    const fd = new FormData();

    fd.append("price", String(parsePrice(form.price)));
    fd.append("service_type", "configurable");
    fd.append("category_id", String((form as any).category_id));

    if (!mainImageFile) {
      toast(lang === "ar" ? "يرجى إضافة الصورة الرئيسية" : "Please add a main image.");
      throw new Error("main_image missing");
    }
    fd.append("main_image", mainImageFile);

    fd.append("translations[0][language]", "ar");
    fd.append("translations[0][name]", String(form.name || ""));
    fd.append("translations[0][description]", String(form.description || ""));

    fd.append("translations[1][language]", "en");
    fd.append("translations[1][name]", String((form as any).nameEn || form.name || ""));
    fd.append("translations[1][description]", String(form.description || ""));

    gallery.forEach((g, i) => {
      if (!g.file) return; // ✅ تجاهل remote في create
      fd.append(`images[${i}][image]`, g.file);
      fd.append(`images[${i}][sort_order]`, String(i + 1));
    });


    selectedOptionIds.forEach((optId, i) => {
      fd.append(`option_ids[${i}]`, String(optId));
    });

    const subs = (form.subscriptions || []) as any[];
    subs.forEach((sub, i) => {
      const sessions = Number(sub.sessionsCount || 0);
      const percent = Number(sub.pricePercent || 0);
      const fixed = calculatePreviewPrice(sessions, percent);
      const pps = sessions > 0 ? fixed / sessions : 0;

      fd.append(`subscriptions[${i}][session_count]`, String(sessions));
      fd.append(`subscriptions[${i}][price_percentage]`, String(percent));
      fd.append(`subscriptions[${i}][fixed_price]`, String(fixed));
      fd.append(`subscriptions[${i}][price_per_session]`, String(pps));
      fd.append(`subscriptions[${i}][validity_days]`, String(Number(sub.validityDays || 0)));
      fd.append(`subscriptions[${i}][is_active]`, "1");

      fd.append(`subscriptions[${i}][translations][0][language]`, "ar");
      fd.append(`subscriptions[${i}][translations][0][name]`, String(sub.title || ""));
      fd.append(`subscriptions[${i}][translations][0][description]`, "");

      fd.append(`subscriptions[${i}][translations][1][language]`, "en");
      fd.append(`subscriptions[${i}][translations][1][name]`, String(sub.title || ""));
      fd.append(`subscriptions[${i}][translations][1][description]`, "");
    });

    const res = await http.post(`${DASHBOARD_API_BASE_URL}/services`, fd, {
      headers: { lang, "Content-Type": "multipart/form-data" },
    });

    const ok = !!res?.data?.status;
    const msg = res?.data?.message || (ok ? "Created" : "Failed");

    toast(msg, {
      style: {
        background: ok ? "#198754" : "#dc3545",
        color: "#fff",
        borderRadius: "10px",
      },
    });

    if (!ok) throw new Error(msg);
    return res.data;
  }

  // ----------------- Update Service API (FormData) -----------------
  async function updateService(serviceId: string) {
    const fd = new FormData();

    fd.append("_method", "PUT");
    fd.append("price", String(parsePrice(form.price)));
    fd.append("service_type", "configurable");
    fd.append("category_id", String((form as any).category_id));

    if (mainImageFile) {
      fd.append("main_image", mainImageFile);
    }

    fd.append("translations[0][language]", "ar");
    fd.append("translations[0][name]", String(form.name || ""));
    fd.append("translations[0][description]", String(form.description || ""));

    fd.append("translations[1][language]", "en");
    fd.append("translations[1][name]", String((form as any).nameEn || form.name || ""));
    fd.append("translations[1][description]", String(form.description || ""));

    let imageIndex = 0;
    gallery.forEach((g) => {
      if (g.file) {
        fd.append(`images[${imageIndex}][image]`, g.file);
        fd.append(`images[${imageIndex}][sort_order]`, String(imageIndex + 1));
        imageIndex++;
      }
    });

    selectedOptionIds.forEach((optId, i) => {
      fd.append(`option_ids[${i}]`, String(optId));
    });

    const subs = (form.subscriptions || []) as any[];
    subs.forEach((sub, i) => {
      const sessions = Number(sub.sessionsCount || 0);
      const percent = Number(sub.pricePercent || 0);
      const fixed = calculatePreviewPrice(sessions, percent);
      const pps = sessions > 0 ? fixed / sessions : 0;

      fd.append(`subscriptions[${i}][session_count]`, String(sessions));
      fd.append(`subscriptions[${i}][price_percentage]`, String(percent));
      fd.append(`subscriptions[${i}][fixed_price]`, String(fixed));
      fd.append(`subscriptions[${i}][price_per_session]`, String(pps));
      fd.append(`subscriptions[${i}][validity_days]`, String(Number(sub.validityDays || 0)));
      fd.append(`subscriptions[${i}][is_active]`, "1");

      fd.append(`subscriptions[${i}][translations][0][language]`, "ar");
      fd.append(`subscriptions[${i}][translations][0][name]`, String(sub.title || ""));
      fd.append(`subscriptions[${i}][translations][0][description]`, "");

      fd.append(`subscriptions[${i}][translations][1][language]`, "en");
      fd.append(`subscriptions[${i}][translations][1][name]`, String(sub.title || ""));
      fd.append(`subscriptions[${i}][translations][1][description]`, "");
    });

    const res = await http.post(`${DASHBOARD_API_BASE_URL}/services/${serviceId}`, fd, {
      headers: { lang, Accept: "application/json" },
    });

    const ok = !!res?.data?.status;
    const msg = res?.data?.message || (ok ? "Updated" : "Failed");

    toast(msg, {
      style: {
        background: ok ? "#198754" : "#dc3545",
        color: "#fff",
        borderRadius: "10px",
      },
    });

    if (!ok) throw new Error(msg);
    return res.data;
  }

  // ----------------- Save -----------------
  const handleSave = async () => {
    if (!form.name) {
      toast(lang === "ar" ? "يرجى إدخال اسم الخدمة" : "Please enter the service name.");
      return;
    }

    if (!(form as any).category_id) {
      toast(lang === "ar" ? "يرجى اختيار القسم" : "Please select a category.");
      return;
    }

    const hasMainImage = !!mainImageFile || !!mainImagePreview;
    if (!hasMainImage) {
      toast(lang === "ar" ? "يرجى إضافة الصورة الرئيسية" : "Please add a main image.");
      return;
    }

    if (form.subscriptions) {
      for (const sub of form.subscriptions as any[]) {
        if (!sub.title || sub.title.trim().length < 2) {
          toast(
            lang === "ar"
              ? "يرجى إدخال عنوان صحيح لجميع الاشتراكات"
              : "Please enter a valid title for all subscriptions."
          );
          return;
        }
        if (Number(sub.sessionsCount) < 2) {
          toast(
            lang === "ar"
              ? `عدد الجلسات يجب أن يكون 2 على الأقل للاشتراك: ${sub.title}`
              : `Sessions count must be at least 2 for subscription: ${sub.title}`
          );
          return;
        }
        if (Number(sub.validityDays) < 1) {
          toast(
            lang === "ar"
              ? `مدة الصلاحية يجب أن تكون يوم واحد على الأقل للاشتراك: ${sub.title}`
              : `Validity days must be at least 1 for subscription: ${sub.title}`
          );
          return;
        }
      }
    }

    try {
      setSaving(true);
      if (isEdit && id) {
        await updateService(id);
        navigate("/admin/services");
      } else {
        await createService();
        navigate("/admin/services");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return null;

  if (notFound) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <p className="text-gray-500 font-semibold">Service not found</p>
        <button
          onClick={() => navigate("/admin/services")}
          className="bg-[#483383] text-white px-6 py-2 rounded-xl font-semibold"
        >
          Back to Services
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-20 relative">
      <PageHeader
        lang={lang}
        isEdit={isEdit}
        id={id}
        t={t}
        onCancel={handleCancel}
        onSave={handleSave}
        saving={saving}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <BasicInfoCard
            lang={lang}
            t={t}
            form={form}
            setForm={setForm}
            catsLoading={catsLoading}
            categories={categories}
          />

          <AddonsCard
            lang={lang}
            t={t}
            expanded={isAddonsExpanded}
            onToggleExpanded={() => setIsAddonsExpanded((x) => !x)}
            optionsLoading={optionsLoading}
            options={options}
            selectedOptionIds={selectedOptionIds}
            onToggleOption={handleToggleGlobalAddon}
          />

          <SubscriptionsCard
            lang={lang}
            t={t}
            subscriptions={(form.subscriptions || []) as any[]}
            onAdd={handleAddSubscription}
            onRemove={handleRemoveSubscription}
            onDuplicate={handleDuplicateSubscription}
            onChange={handleSubscriptionChange}
            calcPreview={calculatePreviewPrice}
          />
        </div>

        <div className="space-y-6">
          <MediaCard
            mainImagePreview={mainImagePreview}
            onMainImageUpload={handleMainImageUpload}
            onRemoveMainImage={handleRemoveMainImage}
            gallery={gallery}
            onGalleryUpload={handleGalleryUpload}
            onSetAsMain={handleSetAsMain}
            onRemoveGalleryImage={handleRemoveGalleryImage}
          />
        </div>
      </div>

      <ExitPrompt
        lang={lang}
        open={showExitPrompt}
        onConfirm={confirmExit}
        onClose={() => setShowExitPrompt(false)}
      />
    </div>
  );
};

export default ServiceFormPage;
