const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function getToken() { return localStorage.getItem('bdms_token'); }
export function setToken(token) {
  if (token) localStorage.setItem('bdms_token', token);
  else localStorage.removeItem('bdms_token');
}

export async function api(path, options = {}) {
  const res = await fetch(API_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: 'Bearer ' + getToken() } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    setToken(null);
    if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed. Is the server running?');
  return data;
}

export const peso = n => '\u20B1' + Number(n || 0).toLocaleString('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
