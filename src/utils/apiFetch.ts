// Skew (seconds) to refresh proactively before the access token actually expires.
const TOKEN_REFRESH_SKEW = 30;

let refreshInFlight: Promise<string | null> | null = null;

function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2 || !parts[1]) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    const payload = JSON.parse(atob(padded));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

function isTokenExpiringSoon(token: string): boolean {
  const exp = decodeJwtExp(token);
  if (exp === null) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return exp - nowSec <= TOKEN_REFRESH_SKEW;
}

function clearSessionAndRedirect() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

async function performRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json().catch(() => null);
    if (!data?.success || !data?.data?.accessToken) return null;

    localStorage.setItem('accessToken', data.data.accessToken);
    if (data.data.refreshToken) {
      localStorage.setItem('refreshToken', data.data.refreshToken);
    }
    return data.data.accessToken;
  } catch {
    return null;
  }
}

function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let token = localStorage.getItem('accessToken');

  if (token && isTokenExpiringSoon(token)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      token = refreshed;
    } else {
      clearSessionAndRedirect();
      return new Response(null, { status: 401, statusText: 'Unauthorized' });
    }
  }

  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers.set('Authorization', `Bearer ${refreshed}`);
      response = await fetch(url, { ...options, headers });
      if (response.status === 401) {
        clearSessionAndRedirect();
      }
    } else {
      clearSessionAndRedirect();
    }
  }

  return response;
};
