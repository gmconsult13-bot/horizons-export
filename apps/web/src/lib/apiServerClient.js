const API_SERVER_URL = '/hcgi/api';

const apiServerClient = {
  fetch: async (url, options = {}) => {
    const headers = new Headers(options.headers || {});
    const adminToken = localStorage.getItem('adminAuthToken');

    if (adminToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${adminToken}`);
    }

    return await window.fetch(API_SERVER_URL + url, {
      ...options,
      headers,
    });
  }
};

export default apiServerClient;
export { apiServerClient };