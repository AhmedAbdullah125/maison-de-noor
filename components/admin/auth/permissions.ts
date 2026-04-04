const SESSION_KEY = 'salon_admin_session';

export type AdminSession = {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
    permissions: string[]; // raw API permission names e.g. "view dashboard"
    roles: string[];
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string;
};

/** Retrieve the stored admin session, or null if not logged in.
 *  Normalises the permissions field in case a stale session with the old
 *  boolean-map format is still in localStorage. */
export function getAdminSession(): AdminSession | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
        const session = JSON.parse(raw) as AdminSession;

        // Migrate old format: { view_dashboard: true } → ["view dashboard"]
        if (session.permissions && !Array.isArray(session.permissions)) {
            const permObj = session.permissions as unknown as Record<string, boolean>;
            session.permissions = Object.entries(permObj)
                .filter(([, v]) => v === true)
                .map(([k]) => k.replace(/_/g, ' ')); // view_dashboard → "view dashboard"
        }

        return session;
    } catch {
        return null;
    }
}

/** Check if the logged-in admin has a specific permission by exact API name */
export function hasPermission(permission: string): boolean {
    const session = getAdminSession();
    if (!session) return false;
    if (!Array.isArray(session.permissions)) return false;
    return session.permissions.includes(permission);
}

/** Check if the admin has any of the given permissions */
export function hasAnyPermission(...permissions: string[]): boolean {
    const session = getAdminSession();
    if (!session) return false;
    return permissions.some(p => session.permissions.includes(p));
}

/** Check if the admin has ALL of the given permissions */
export function hasAllPermissions(...permissions: string[]): boolean {
    const session = getAdminSession();
    if (!session) return false;
    return permissions.every(p => session.permissions.includes(p));
}

/** Get the full list of permissions the admin has */
export function getPermissions(): string[] {
    return getAdminSession()?.permissions ?? [];
}
