import { apiRequest } from './api';

const AUTH_STORAGE_KEYS = ['token', 'userId', 'userRole', 'userName', 'userEmail'];

const normalizeRole = (role) => {
  if (!role || typeof role !== 'string') {
    return '';
  }

  return role.toUpperCase();
};

const decodeTokenPayload = (token) => {
  try {
    const payload = token.split('.')[1];

    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized);

    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
};

const buildSession = (token, source = {}) => {
  const decoded = decodeTokenPayload(token) || {};
  const role = normalizeRole(
    source.role ||
      source.userRole ||
      source.userType ||
      decoded.role ||
      decoded.userRole ||
      decoded.userType
  );

  if (!token || !role) {
    return null;
  }

  return {
    token,
    userId: source.userId || source.id || decoded.userId || decoded.id || '',
    role,
    name: source.name || source.userName || decoded.name || '',
    email: source.email || source.userEmail || decoded.email || '',
  };
};

export const persistSession = (session) => {
  if (!session?.token) {
    return;
  }

  localStorage.setItem('token', session.token);

  if (session.userId) {
    localStorage.setItem('userId', session.userId);
  }

  if (session.role) {
    localStorage.setItem('userRole', session.role);
  }

  if (session.name) {
    localStorage.setItem('userName', session.name);
  }

  if (session.email) {
    localStorage.setItem('userEmail', session.email);
  }
};

export const clearSession = () => {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const getStoredToken = () => localStorage.getItem('token');

export const getDefaultRouteForRole = (role) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === 'RECRUITER') {
    return '/recruiter-dashboard';
  }

  return '/candidate-dashboard';
};

export const resolveSession = async (token, fallbackUser = {}) => {
  if (!token) {
    return null;
  }

  try {
    const response = await apiRequest('/api/auth/me', {
      method: 'GET',
      token,
    });

    if (response.ok) {
      const data = await response.json();
      const session = buildSession(token, data);

      if (session) {
        persistSession(session);
        return session;
      }
    }
  } catch (error) {
    // Fall back to token/local storage parsing if the profile lookup is unavailable.
  }

  const fallbackSession = buildSession(token, {
    ...fallbackUser,
    userId: fallbackUser.userId || localStorage.getItem('userId'),
    userRole: fallbackUser.role || localStorage.getItem('userRole'),
    userName: fallbackUser.name || localStorage.getItem('userName'),
    userEmail: fallbackUser.email || localStorage.getItem('userEmail'),
  });

  if (fallbackSession) {
    persistSession(fallbackSession);
  }

  return fallbackSession;
};