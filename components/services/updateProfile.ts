// src/services/updateProfile.ts
import { http } from "./http";

export type UpdateProfilePayload = {
    name?: string;
    email?: string;
    phone?: string;
    photo?: File | null;
};

export async function updateProfileRequest(payload: UpdateProfilePayload, lang: string = "ar") {
    const form = new FormData();

    if (payload.name !== undefined) form.append("name", payload.name);
    if (payload.email !== undefined) form.append("email", payload.email);
    if (payload.phone !== undefined) form.append("phone", payload.phone);
    if (payload.photo) form.append("photo", payload.photo);

    // ⚠️ مهم: ما تحطش Content-Type يدويًا.. axios هيحطه boundary لوحده
    const res = await http.put("/update-profile", form, {
        headers: { lang },
    });

    return res.data; // المتوقع يرجع status + items
}
