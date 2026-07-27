import axios, { AxiosError } from 'axios';

// In local dev, Vite's dev-server proxy forwards /api/v1 -> localhost:4000.
// In production (e.g. Vercel), there is no such proxy, so the deployed
// backend's full URL must be provided via VITE_API_URL (see .env.production).
const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({ baseURL });

let accessToken: string | null = localStorage.getItem('aitellion_access_token');
let refreshToken: string | null = localStorage.getItem('aitellion_refresh_token');

export function setTokens(access: string | null, refresh: string | null) {
  accessToken = access;
  refreshToken = refresh;
  if (access) localStorage.setItem('aitellion_access_token', access);
  else localStorage.removeItem('aitellion_access_token');
  if (refresh) localStorage.setItem('aitellion_refresh_token', refresh);
  else localStorage.removeItem('aitellion_refresh_token');
}

export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshToken) return null;
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${baseURL}/auth/refresh`, { refreshToken })
      .then((res) => {
        setTokens(res.data.accessToken, res.data.refreshToken);
        return res.data.accessToken as string;
      })
      .catch(() => {
        setTokens(null, null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
