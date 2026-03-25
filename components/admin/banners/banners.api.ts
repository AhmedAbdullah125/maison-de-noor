import { toast } from 'sonner';
import { http } from '../../services/http';
import { DASHBOARD_API_BASE_URL } from '@/lib/apiConfig';
import { Locale } from '../../../services/i18n';

export type ApiBanner = {
  id: number;
  title: string;
  image: string;
  url: string;
  position: number;
  is_active: number;
};

export type ApiPaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

type ApiBannersResponse = {
  status: boolean;
  data: { data: ApiBanner[]; meta: ApiPaginationMeta };
  message: string;
};

type ApiSimpleResponse = {
  status: boolean;
  message: string;
  data?: any;
};

function toastApi(status: boolean, message: string) {
  toast(message || (status ? 'Success' : 'Something went wrong'), {
    style: {
      background: status ? '#198754' : '#dc3545',
      color: '#fff',
      borderRadius: '10px',
    },
  });
}

function getAuthHeaders(lang: Locale) {
  const token = localStorage.getItem('token');
  return {
    lang,
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function getBanners(lang: Locale, page: number, perPage = 10) {
  try {
    const res = await http.get<ApiBannersResponse>(
      `${DASHBOARD_API_BASE_URL}/banners`,
      {
        params: { page, per_page: perPage },
        headers: getAuthHeaders(lang),
      }
    );

    if (!res?.data?.status) {
      toastApi(false, res?.data?.message || 'Failed');
      return { ok: false as const, error: res?.data?.message || 'Failed' };
    }

    return {
      ok: true as const,
      data: res.data.data.data,
      meta: res.data.data.meta,
    };
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || 'Fetch banners error';
    toastApi(false, msg);
    return { ok: false as const, error: msg };
  }
}

export async function createBanner(
  input: {
    image: File;
    url?: string;
    title_ar: string;
    title_en: string;
  },
  lang: Locale
) {
  try {
    const fd = new FormData();
    fd.append('image', input.image);
    if (input.url) fd.append('url', input.url);
    fd.append('translations[0][language]', 'ar');
    fd.append('translations[0][title]', input.title_ar);
    fd.append('translations[1][language]', 'en');
    fd.append('translations[1][title]', input.title_en);

    const res = await http.post<ApiSimpleResponse>(
      `${DASHBOARD_API_BASE_URL}/banners`,
      fd,
      { headers: getAuthHeaders(lang) }
    );

    toastApi(!!res?.data?.status, res?.data?.message);

    if (!res?.data?.status) return { ok: false as const, error: res?.data?.message || 'Create failed' };
    return { ok: true as const, data: res.data.data };
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || 'Create banner error';
    toastApi(false, msg);
    return { ok: false as const, error: msg };
  }
}

export async function updateBanner(
  id: number,
  input: {
    image?: File;
    url?: string;
    title_ar: string;
    title_en: string;
  },
  lang: Locale
) {
  try {
    const fd = new FormData();
    fd.append('_method', 'PATCH');
    if (input.image) fd.append('image', input.image);
    if (input.url !== undefined) fd.append('url', input.url);
    fd.append('translations[0][language]', 'ar');
    fd.append('translations[0][title]', input.title_ar);
    fd.append('translations[1][language]', 'en');
    fd.append('translations[1][title]', input.title_en);

    const res = await http.post<ApiSimpleResponse>(
      `${DASHBOARD_API_BASE_URL}/banners/${id}`,
      fd,
      { headers: getAuthHeaders(lang) }
    );

    toastApi(!!res?.data?.status, res?.data?.message);

    if (!res?.data?.status) return { ok: false as const, error: res?.data?.message || 'Update failed' };
    return { ok: true as const, data: res.data.data };
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || 'Update banner error';
    toastApi(false, msg);
    return { ok: false as const, error: msg };
  }
}

export async function deleteBanner(id: number, lang: Locale) {
  try {
    const res = await http.delete<ApiSimpleResponse>(
      `${DASHBOARD_API_BASE_URL}/banners/${id}`,
      { headers: getAuthHeaders(lang) }
    );

    toastApi(!!res?.data?.status, res?.data?.message);

    if (!res?.data?.status) return { ok: false as const, error: res?.data?.message || 'Delete failed' };
    return { ok: true as const };
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || 'Delete banner error';
    toastApi(false, msg);
    return { ok: false as const, error: msg };
  }
}
