"use client";

import React, { useState, useMemo } from "react";
import {
    Plus, X, Search, Shield, Check,
    ChevronLeft, ChevronRight, UserCheck, Loader2,
    Edit, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { translations, Locale } from "../../services/i18n";
import { useAdmins } from "./managers/useAdmins";
import { ApiAdmin, CreateAdminPayload } from "./managers/managers.api";
import { useAdminActions } from "./managers/useAdminActions";
import { useRoles } from "./staff/useRoles";

interface ManagersModuleProps {
    lang: Locale;
}

const EMPTY_FORM: CreateAdminPayload = {
    name: "",
    username: "",
    email: "",
    password: "",
    account_type: "admin",
    role: "",
};

function formatDate(createdAt: string, lang: Locale) {
    const iso = createdAt?.includes(" ") ? createdAt.replace(" ", "T") : createdAt;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return createdAt;
    return d.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US");
}

function safeLower(s: any) {
    return String(s ?? "").toLowerCase();
}

const ManagersModule: React.FC<ManagersModuleProps> = ({ lang }) => {
    const t = translations[lang];
    const {
        isLoading,
        admins,
        pagination,
        page,
        setPage,
        canPrev,
        canNext,
        totalPages,
        refetch,
    } = useAdmins(lang, 10);

    const { roles, isLoading: rolesLoading } = useRoles(lang, 200);
    const { isSaving, isDeleting, create, update, remove } = useAdminActions(lang);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

    // Modal: mode null = closed, "add" = create, "edit" = update
    const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
    const [editingAdmin, setEditingAdmin] = useState<ApiAdmin | null>(null);
    const [form, setForm] = useState<CreateAdminPayload>({ ...EMPTY_FORM });
    const [formError, setFormError] = useState<string | null>(null);

    // Delete confirmation
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const filtered = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        return admins.filter((m) => {
            const matchesSearch =
                !q ||
                safeLower(m.name).includes(q) ||
                safeLower(m.username).includes(q) ||
                safeLower(m.email).includes(q);
            const matchesStatus = statusFilter === "all" || m.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [admins, searchTerm, statusFilter]);

    // ── Modal helpers ──────────────────────────────────────────────────
    const openAdd = () => {
        setEditingAdmin(null);
        setForm({ ...EMPTY_FORM });
        setFormError(null);
        setModalMode("add");
    };

    const openEdit = (admin: ApiAdmin) => {
        setEditingAdmin(admin);
        setForm({
            name: admin.name,
            username: admin.username,
            email: admin.email,
            password: "", // never pre-fill password
            account_type: "admin",
            role: admin.roles[0] ?? "",
        });
        setFormError(null);
        setModalMode("edit");
    };

    const closeModal = () => {
        if (isSaving) return;
        setModalMode(null);
        setEditingAdmin(null);
    };

    // ── Validation ─────────────────────────────────────────────────────
    const validate = (): boolean => {
        if (!form.name.trim() || !form.username.trim() || !form.email.trim()) {
            const msg = lang === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields";
            setFormError(msg);
            toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            return false;
        }
        // Password required only when adding
        if (modalMode === "add" && !form.password.trim()) {
            const msg = lang === "ar" ? "كلمة المرور مطلوبة" : "Password is required";
            setFormError(msg);
            toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            return false;
        }
        if (!form.role?.trim()) {
            const msg = lang === "ar" ? "يرجى اختيار دور" : "Please select a role";
            setFormError(msg);
            toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            return false;
        }
        setFormError(null);
        return true;
    };

    // ── Save ───────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!validate()) return;

        if (modalMode === "add") {
            await create(form, () => { closeModal(); refetch(); });
        } else if (modalMode === "edit" && editingAdmin) {
            await update(editingAdmin.id, form, () => { closeModal(); refetch(); });
        }
    };

    // ── Delete ─────────────────────────────────────────────────────────
    const handleDelete = async (id: number) => {
        setDeletingId(id);
        await remove(id, () => refetch());
        setDeletingId(null);
    };

    // ── Field helper ───────────────────────────────────────────────────
    const field = (
        id: string,
        label: string,
        type: string,
        value: string,
        onChange: (v: string) => void,
        required = true,
        placeholder?: string,
    ) => (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-sm font-semibold text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                id={id}
                type={type}
                dir={type === "email" || type === "password" ? "ltr" : undefined}
                className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383]/30 focus:border-[#483383] text-sm transition-all"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder ?? ""}
                disabled={isSaving}
            />
        </div>
    );

    const renderSkeleton = () => (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-auto">
            <div className="h-12 bg-gray-50 border-b border-gray-100" />
            <div className="p-6 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 bg-gray-50 rounded-2xl animate-pulse" />
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-1 gap-3">
                    <div className="relative flex-1 max-w-md">
                        <input
                            type="text"
                            className={`w-full ${lang === "ar" ? "pr-11 pl-4" : "pl-11 pr-4"} py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383]`}
                            placeholder={t.searchManagers}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search
                            className={`absolute ${lang === "ar" ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-gray-400`}
                            size={18}
                        />
                    </div>
                    <select
                        className="bg-white border border-gray-200 px-4 py-3 rounded-2xl text-xs font-semibold outline-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="all">{t.all}</option>
                        <option value="active">{t.active}</option>
                        <option value="inactive">{lang === "ar" ? "غير نشط" : "Inactive"}</option>
                    </select>
                </div>

                <button
                    onClick={openAdd}
                    className="bg-[#483383] text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-lg hover:bg-[#3a2870] transition-colors"
                >
                    <Plus size={20} />
                    <span>{t.addManager}</span>
                </button>
            </div>

            {/* Table */}
            {isLoading ? (
                renderSkeleton()
            ) : (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-auto">
                    <table className="w-full text-start">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.fullName}</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.username}</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.email}</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.status}</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">{t.staffHR}</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">
                                    {lang === "ar" ? "تاريخ الإنشاء" : "Created"}
                                </th>
                                <th className={`px-6 py-4 text-xs font-semibold text-gray-400 uppercase ${lang === "ar" ? "text-start" : "text-end"}`}>
                                    {t.actions}
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                                        {lang === "ar" ? "لا يوجد مشرفون" : "No admins found"}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((admin: ApiAdmin) => {
                                    const isSuperAdmin = admin.roles.includes("super-admin");
                                    const isActive = admin.status === "active";
                                    const isBeingDeleted = deletingId === admin.id && isDeleting;

                                    return (
                                        <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#483383]">
                                                        <UserCheck size={16} />
                                                    </div>
                                                    <span className="font-semibold text-gray-900">{admin.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{admin.username}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500" dir="ltr">{admin.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border flex items-center gap-1.5 w-fit ${isActive ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"}`}>
                                                    {isActive ? <Check size={12} /> : <X size={12} />}
                                                    {isActive ? t.active : (lang === "ar" ? "غير نشط" : "Inactive")}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isSuperAdmin ? (
                                                    <span className="flex items-center gap-1 text-[10px] font-semibold text-[#483383]">
                                                        <Shield size={12} />
                                                        {t.fullAccess ?? "Super Admin"}
                                                    </span>
                                                ) : admin.roles.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {admin.roles.map((r) => (
                                                            <span key={r} className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-purple-50 text-purple-600">{r}</span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-gray-400">
                                                        {lang === "ar" ? "لا يوجد أدوار" : "No roles"}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400">{formatDate(admin.created_at, lang)}</td>

                                            {/* Actions */}
                                            <td className={`px-6 py-4 ${lang === "ar" ? "text-start" : "text-end"}`}>
                                                <div className={`flex items-center gap-2 ${lang === "ar" ? "justify-start" : "justify-end"}`}>
                                                    <button
                                                        onClick={() => openEdit(admin)}
                                                        disabled={isBeingDeleted}
                                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-40"
                                                        title={t.edit}
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(admin.id)}
                                                        disabled={isBeingDeleted}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40 flex items-center"
                                                        title={t.delete}
                                                    >
                                                        {isBeingDeleted
                                                            ? <Loader2 size={16} className="animate-spin" />
                                                            : <Trash2 size={16} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {!isLoading && pagination && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3">
                    <div className="text-xs text-gray-500 shrink-0">
                        {lang === "ar" ? (
                            <span>الصفحة {pagination.current_page} من {pagination.total_pages} — الإجمالي {pagination.total_items}</span>
                        ) : (
                            <span>Page {pagination.current_page} of {pagination.total_pages} — Total {pagination.total_items}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={!canPrev}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                            <ChevronLeft size={16} className={lang === "ar" ? "rotate-180" : ""} />
                        </button>
                        {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-9 h-9 rounded-xl text-sm font-semibold border transition-colors ${p === pagination.current_page ? "bg-[#483383] text-white border-[#483383]" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            disabled={!canNext}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                            <ChevronRight size={16} className={lang === "ar" ? "rotate-180" : ""} />
                        </button>
                    </div>
                </div>
            )}

            {/* Add / Edit Modal */}
            {modalMode !== null && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {modalMode === "add" ? t.addManager : t.editManager}
                            </h3>
                            <button
                                onClick={closeModal}
                                disabled={isSaving}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 space-y-4 overflow-y-auto">
                            {field("admin-name", lang === "ar" ? "الاسم" : "Name", "text", form.name, (v) => setForm({ ...form, name: v }))}
                            {field("admin-username", lang === "ar" ? "اسم المستخدم" : "Username", "text", form.username, (v) => setForm({ ...form, username: v }))}
                            {field("admin-email", lang === "ar" ? "البريد الإلكتروني" : "Email", "email", form.email, (v) => setForm({ ...form, email: v }))}
                            {field(
                                "admin-password",
                                lang === "ar" ? "كلمة المرور" : "Password",
                                "password",
                                form.password,
                                (v) => setForm({ ...form, password: v }),
                                modalMode === "add", // required only on add
                                modalMode === "edit"
                                    ? (lang === "ar" ? "اتركه فارغاً للإبقاء على الحالي" : "Leave blank to keep current")
                                    : "••••••••",
                            )}

                            {/* Role */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="admin-role" className="text-sm font-semibold text-gray-700">
                                    {t.staffHR ?? "Role"} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="admin-role"
                                    className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383]/30 focus:border-[#483383] text-sm transition-all disabled:opacity-50"
                                    value={form.role ?? ""}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    disabled={isSaving || rolesLoading}
                                >
                                    <option value="" disabled>
                                        {rolesLoading
                                            ? (lang === "ar" ? "جارٍ التحميل..." : "Loading...")
                                            : (lang === "ar" ? "اختر دوراً" : "Select role")}
                                    </option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.name}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            {formError && (
                                <p className="text-sm text-red-500 font-medium">{formError}</p>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 border-t border-gray-100 flex gap-3 shrink-0">
                            <button
                                onClick={closeModal}
                                disabled={isSaving}
                                className="flex-1 py-3.5 font-semibold text-gray-500 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                {t.cancel}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 py-3.5 font-semibold text-white bg-[#483383] rounded-2xl shadow-lg hover:bg-[#3a2870] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isSaving && <Loader2 size={16} className="animate-spin" />}
                                {t.save}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagersModule;
