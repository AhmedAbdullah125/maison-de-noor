// Resolve an API URL from the environment. Production builds may use the baked-in
// production default; any non-production build throws when the value is missing
// instead of silently targeting the production API.
function resolveApiUrl(value, productionDefault, name) {
  if (value) return value;
  if (import.meta.env.PROD) return productionDefault;
  throw new Error(
    `[config] ${name} is not set. Define it in your .env (e.g. ${name}=http://localhost:8000/api). ` +
      'Refusing to fall back to the production API in a non-production build.'
  );
}

const API_BASE_URL = resolveApiUrl(import.meta.env.VITE_API_BASE_URL, 'https://maison-de-noor.com/api/v1', 'VITE_API_BASE_URL');
const DASHBOARD_API_BASE_URL = resolveApiUrl(import.meta.env.VITE_DASHBOARD_API_BASE_URL, 'https://maison-de-noor.com/api', 'VITE_DASHBOARD_API_BASE_URL');

const API_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  USER_PROFILE: '/user/profile',
  COUPONS: '/coupons',
  // Add more endpoints as needed
};

export { API_BASE_URL, API_ENDPOINTS, DASHBOARD_API_BASE_URL };
