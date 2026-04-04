export const API_BASE_URL = 'https://smarthiree.duckdns.org';

export const getAuthHeaders = (token, headers = {}) => ({
  ...headers,
  Authorization: `Bearer ${token}`,
});

export const apiRequest = async (path, options = {}) => {
  const { token, headers = {}, ...restOptions } = options;
  const requestHeaders = token ? getAuthHeaders(token, headers) : headers;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...restOptions,
    headers: requestHeaders,
  });
};
