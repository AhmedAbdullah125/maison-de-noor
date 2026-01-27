"use client";

import React, { useMemo, useState } from "react";
import { toastApi } from "./categories/categories.api";
import { Brand } from "../../types";
import { Locale } from "../../services/i18n";
import { useCategories } from "./categories/useCategories";

import CategoriesToolbar from "./categories/CategoriesToolbar";
import CategoriesTable from "./categories/CategoriesTable";
import CategoriesPagination from "./categories/CategoriesPagination";
import CategoryModal, { CategoryFormState } from "./categories/CategoryModal";

function mapApiToBrand(cat: any): Brand {
  return { id: cat.id, name: cat.name_ar, nameEn: cat.name_en, image: cat.image, productIds: [] };
}

interface CategoriesModuleProps {
  lang: Locale;
}

export default function CategoriesModule({ lang }: CategoriesModuleProps) {
  const perPage = 20;
  const {
    isLoading,
    apiRows,
    meta,
    page,
    setPage,
    canPrev,
    canNext,
    servicesCountById,
    create,
    update,
    remove,
  } = useCategories(lang, perPage);

  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<CategoryFormState>({
    name_ar: "",
    name_en: "",
    position: 1,
    is_active: true,
    imageUrl: "",
    currentImage: "",
  });

  const data: Brand[] = useMemo(() => apiRows.map(mapApiToBrand), [apiRows]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return data;
    return data.filter((c) => {
      const ar = (c.name || "").toLowerCase();
      const en = (c.nameEn || "").toLowerCase();
      return ar.includes(q) || en.includes(q);
    });
  }, [data, searchTerm]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name_ar: "",
      name_en: "",
      position: 1,
      is_active: true,
      imageUrl: "",
      currentImage: "",
    });
    setModalOpen(true);
  };

  const openEdit = (cat: Brand) => {
    setEditingId(Number(cat.id));
    setForm({
      name_ar: cat.name || "",
      name_en: cat.nameEn || "",
      position: 1,
      is_active: true,
      imageUrl: "",
      currentImage: cat.image || "",
    });
    setModalOpen(true);
  };

  const onSave = async () => {
    if (!form.name_ar.trim()) {
      toastApi(false, "الاسم العربي مطلوب");
      return;
    }

    setSaving(true);

    if (!editingId) {
      await create({
        name_ar: form.name_ar.trim(),
        name_en: form.name_en.trim(),
        position: Number(form.position) || 1,
        is_active: !!form.is_active,
        imageUrl: form.imageUrl || "",
      });
      setSaving(false);
      setModalOpen(false);
      return;
    }

    await update(editingId, {
      name_ar: form.name_ar.trim(),
      name_en: form.name_en.trim(),
      position: Number(form.position) || 1,
      is_active: !!form.is_active,
      imageUrl: form.imageUrl || undefined,
    });

    setSaving(false);
    setModalOpen(false);
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-auto">
        <div className="h-12 bg-gray-50 border-b border-gray-100" />
        <div className="p-6 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-gray-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <CategoriesToolbar
        lang={lang}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAdd={openCreate}
      />

      {isLoading ? (
        renderSkeleton()
      ) : (
        <CategoriesTable
          lang={lang}
          rows={filtered}
          servicesCountById={servicesCountById}
          onEdit={openEdit}
          onDelete={remove}
        />
      )}

      {!isLoading && meta && (
        <CategoriesPagination
          lang={lang}
          meta={{
            current_page: meta.current_page,
            last_page: meta.last_page,
            total: meta.total,
          }}
          canPrev={canPrev}
          canNext={canNext}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      )}

      <CategoryModal
        lang={lang}
        open={modalOpen}
        editingId={editingId}
        form={form}
        setForm={setForm}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSave={onSave}
      />
    </div>
  );
}
