const API_SERVER_URL = '/hcgi/api';

const apiServerClient = {
  fetch: async (url, options = {}) => {
    const headers = new Headers(options.headers || {});
    const adminToken = localStorage.getItem('adminAuthToken');
    const suppliedAuthorization = headers.get('Authorization');
    const suppliedTokenIsEmpty = /^Bearer\s+(null|undefined)?\s*$/i.test(
      suppliedAuthorization || ''
    );

    if (adminToken && (!suppliedAuthorization || suppliedTokenIsEmpty)) {
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
