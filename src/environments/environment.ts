export const environment = {
  production: false,
  apiUrl: typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '/api/v1'
    : 'http://localhost:8080/api/v1',
};

