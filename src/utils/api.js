export const API_BASE_URL = 'https://smarthire-hack.onrender.com';

export const getAuthHeaders = (token, headers = {}) => ({
  ...headers,
  Authorization: `Bearer ${token}`,
});

export const apiRequest = async (path, options = {}) => {
  const { token, headers = {}, ...restOptions } = options;
  const requestHeaders = token ? getAuthHeaders(token, headers) : headers;

  return fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers: requestHeaders,
  });
};
