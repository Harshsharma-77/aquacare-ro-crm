'use client';

const AUTH_STORAGE_KEY = 'aquacare_auth_session_v1';
const CREDENTIALS_KEY = 'aquacare_admin_credentials_v1';

export interface AdminCredentials {
  username: string;
  passwordHash: string; // Base64 or plain hash
}

export function getAdminCredentials() {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem(CREDENTIALS_KEY);
    if (custom) {
      try {
        return JSON.parse(custom);
      } catch {}
    }
  }

  // Defaults: admin / alakhkirpa@2026 (or env variables)
  const defaultUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin';
  const defaultPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'alakhkirpa@2026';

  return {
    username: defaultUsername,
    password: defaultPassword
  };
}

export function updateAdminPassword(oldPassword: string, newPassword: string): { success: boolean; message: string } {
  if (typeof window === 'undefined') return { success: false, message: 'Browser only' };
  
  const current = getAdminCredentials();
  if (oldPassword !== current.password) {
    return { success: false, message: 'Current password does not match.' };
  }

  if (newPassword.length < 6) {
    return { success: false, message: 'New password must be at least 6 characters long.' };
  }

  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({
    username: current.username,
    password: newPassword
  }));

  return { success: true, message: 'Password updated successfully!' };
}

export function checkIsAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const session = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (!session) return false;

  try {
    const data = JSON.parse(session);
    // Check if session has expired (30 days for remember me, 12 hours for session)
    if (data.expiresAt && Date.now() > data.expiresAt) {
      logoutAdmin();
      return false;
    }
    return Boolean(data.token && data.username);
  } catch {
    return false;
  }
}

export function loginAdmin(username: string, password: string, rememberMe: boolean = true): { success: boolean; message?: string } {
  const creds = getAdminCredentials();
  const inputUser = username.trim().toLowerCase();
  const expectedUser = creds.username.trim().toLowerCase();

  if (inputUser === expectedUser && password === creds.password) {
    const sessionData = {
      token: 'sec_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      username: creds.username,
      loggedInAt: Date.now(),
      expiresAt: rememberMe ? Date.now() + 30 * 24 * 60 * 60 * 1000 : Date.now() + 12 * 60 * 60 * 1000
    };

    const str = JSON.stringify(sessionData);
    if (rememberMe) {
      localStorage.setItem(AUTH_STORAGE_KEY, str);
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, str);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('aquacare_auth_changed'));
    }

    return { success: true };
  }

  return { success: false, message: 'Incorrect username or password. Please try again.' };
}

export function logoutAdmin(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    window.dispatchEvent(new Event('aquacare_auth_changed'));
  }
}
